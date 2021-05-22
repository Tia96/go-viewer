package main

import (
	"github.com/mholt/archiver"
	"io"
	"log"
	"os"
)

type openArchiver interface {
	Open(io.Reader, int64) error
	Close() error
	Read() (archiver.File, error)
}

func openCompressedFile(src string) (*os.File, openArchiver) {
	var targetArchiver openArchiver
	switch getFileExt(src) {
	case "zip":
		targetArchiver = &archiver.Zip{}
	case "rar":
		targetArchiver = &archiver.Rar{}
	case "tar":
		targetArchiver = &archiver.Tar{}
	default:
		panic("Error: NotCompressedFile")
	}

	targetFile, err := os.Open(src)
	if err != nil {
		log.Print(err)
	}

	targetInfo, err := targetFile.Stat()
	if err != nil {
		log.Print(err)
	}

	err = targetArchiver.Open(targetFile, targetInfo.Size())
	if err != nil {
		log.Print(err)
	}
	return targetFile, targetArchiver
}

func getFolderInfo(src string) FolderInfo {
	file, fileArchiver := openCompressedFile(src)
	defer fileArchiver.Close()
	defer file.Close()

	pageCount := 0
	for {
		file, err := fileArchiver.Read()
		if err != nil {
			log.Print(err)
			break
		}
		defer file.Close()

		if contains(getConfiguration().imageFileExt, getFileExt(file.Name())) {
			pageCount++
		}
	}

	return FolderInfo{
		TotalPageNum: pageCount,
	}
}

//page: 0-index
func getPage(src string, page int) []byte {
	file, fileArchiver := openCompressedFile(src)
	defer fileArchiver.Close()
	defer file.Close()

	var imageFile archiver.File
	for i := -1; i < page; {
		imageFile, _ = fileArchiver.Read()
		defer imageFile.Close()

		if contains(getConfiguration().imageFileExt, getFileExt(imageFile.Name())) {
			i++
		}
	}

	buf := make([]byte, imageFile.Size())
	if _, err := io.ReadFull(imageFile, buf); err != nil {
		log.Print(err)
	}
	return buf
}
