package main

type FolderInfo struct {
	TotalPageNum int `json:"totalPageNum"`
}

type config struct {
	contentsFolder string
	imageFileExt []string
	compressedFileExt []string
}

var instance *config

func getConfiguration() *config {
	if instance == nil {
		instance = &config{}
		instance.contentsFolder = "static/folder"
		instance.imageFileExt = []string{"jpeg", "jpg", "png"}
		instance.compressedFileExt = []string{"zip", "rar", "tar"}
	}
	return instance
}