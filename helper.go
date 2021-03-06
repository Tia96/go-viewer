package main

import (
	"encoding/json"
	"io/ioutil"
	"log"
	"os"
	"path/filepath"
	"strings"
)

func dirWalk(dir string) []string {
	files, err := ioutil.ReadDir(dir)
	if err != nil {
		panic(err)
	}
	var paths []string
	for _, file := range files {
		if file.Mode().IsDir() || file.Mode()&os.ModeSymlink != 0 {
			paths = append(paths, dirWalk(filepath.Join(dir, file.Name()))...)
		}

		if contains(getConfiguration().compressedFileExt, getFileExt(file.Name())) {
			paths = append(paths, filepath.Join(dir, file.Name()))
		}
	}
	return paths
}

func exists(filename string) bool {
	_, err := os.Stat(filename)
	return err == nil
}

func getFileExt(name string) string {
	fileExt := strings.ToLower(name[strings.LastIndex(name, ".")+1:])
	return fileExt
}

func contains(array []string, item string) bool {
	for _, a := range array {
		if a == item {
			return true
		}
	}
	return false
}

func getJsonFromFolderInfo(folderInfo FolderInfo) []byte {
	jsonData, err := json.Marshal(&folderInfo)
	if err != nil {
		log.Print(err)
	}
	return jsonData
}
