package main

import (
	"fmt"
	"html/template"
	"log"
	"net/http"
	"net/url"
	"strconv"
	"strings"
)

type embeddedData struct {
	Name        string
	TopPage     string
	Thumbnail	string
}

func serveTopPage(w http.ResponseWriter, r *http.Request) {
	templateHtml := template.Must(template.ParseFiles("templates/index.html"))
	files := dirWalk(getConfiguration().contentsFolder)
	var data []embeddedData
	for _, name := range files {
		data = append(data, embeddedData{
			Name:    name,
			TopPage: fmt.Sprintf("/%s/%s", getConfiguration().contentsFolder, url.PathEscape(name)),
			Thumbnail: fmt.Sprintf("/%s/%s?page=0", getConfiguration().contentsFolder, url.PathEscape(name)),
		})
	}
	if err := templateHtml.Execute(w, data); err != nil {
		log.Fatal(err)
	}
}

func serve404(w http.ResponseWriter, r *http.Request) {
	templateHtml := template.Must(template.ParseFiles("templates/404.html"))
	if err := templateHtml.Execute(w, r.URL.Path); err != nil {
		log.Fatal(err)
	}
}

// ServeFiles expects following urls
// /static/css/***.css
// /static/js/***.js
// /static/folder/***.zip
// /static/folder/***.zip/info
// /static/folder/***.zip?page=1
func serveStaticFiles(w http.ResponseWriter, r *http.Request) {
	log.Println(r.URL.Path, r.URL.Query())

	// /static/folder/
	if strings.HasPrefix(r.URL.Path, "/"+getConfiguration().contentsFolder) {
		rest := strings.TrimPrefix(r.URL.Path, "/"+getConfiguration().contentsFolder+"/")
		var fileName string
		if strings.Contains(rest, "/") {
			fileName = rest[:strings.Index(rest, "/")]
		} else {
			fileName = rest
		}

		//info, page, topPage
		if strings.HasSuffix(r.URL.Path, "/info") {
			jsonData := getJsonFromFolderInfo(getFolderInfo(getConfiguration().contentsFolder + "/" + fileName))
			w.Header().Set("Content-type", "application/json")
			if _, err := w.Write(jsonData); err != nil {
				log.Println(err)
			}
		} else if _, ok := r.URL.Query()["page"]; ok {
			page, _ := strconv.Atoi(r.URL.Query()["page"][0])
			file := getPage(getConfiguration().contentsFolder+"/"+fileName, page)
			w.Header().Set("Content-type", "image/png")
			if _, err := w.Write(file); err != nil {
				log.Println(err)
			}
		} else if exists(getConfiguration().contentsFolder + "/" + fileName) {
			http.ServeFile(w, r, "templates/viewer.html")
		}
	} else {
		http.StripPrefix("/static/", http.FileServer(http.Dir("static"))).ServeHTTP(w, r)
	}
}

func handle(w http.ResponseWriter, r *http.Request) {
	//topPage
	if r.URL.Path == "/" {
		serveTopPage(w, r)
	} else if strings.HasPrefix(r.URL.Path, "/static/") {
		serveStaticFiles(w, r)
	} else {
		serve404(w, r)
	}
}
