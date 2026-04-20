const http = require("http");
const fs = require("fs");
const path = require('path')

const download_folder_path = "fileTransScriptFiles" // path of which folder to use
const PORT = 80 // port on which to serve0

function checkDirExists() {
  try {
    const dir = fs.mkdirSync(download_folder_path, { recursive: true })
    if (dir) {
      console.log(`Created download folder for ${download_folder_path}`)
    }
  } catch (e) {
    console.log("Unexpected error occured when creating the file", e)
  }
}

checkDirExists()
const server = http.createServer((req, res) => {
  checkDirExists()
  const files = fs.readdirSync(download_folder_path)
  const filesObject = Object.fromEntries(
    files.map(file => {
      const details = fs.statSync(path.join(download_folder_path, file))
      return [encodeURI(file), {
        size: details.size,
        sizeConverted: sizeConverted(details.size)
      }]
    })
  )

  if (req.url.startsWith("/download/")) { //download the specified file

    handleDownloadFile(req, res)

  } else switch (req.url) {

    case "/getALL": // get json object of all files available
      res.writeHead(200, {
        'Content-Type': 'text/json'
      })
      res.end(JSON.stringify(filesObject))
      break;

    case "/": // serve html
      handleHTML(req, res)
      break;
  }
});

// function handleUploadFile(req, res) {
//   const fileName = req.url.replace(/^\/upload\?filename=/, "").replace(/\+/g, "_")

//   const fileStream = fs.createWriteStream(path.join(download_folder_path, fileName))

//   req.pipe(fileStream);

//   req.on('end', () => {
//     res.writeHead(200);
//     res.end('File uploaded successfully');
//   });

//   req.on('error', (err) => {
//     console.error(err);
//     res.writeHead(500);
//     res.end('Upload failed');
//   });

//   console.log(fileName)
//   console.log(req, res)
// }

function handleDownloadFile(req, res) {
  const files = fs.readdirSync(download_folder_path)
  const fileName = req.url.replace(/^\/download\//g, "").replace("%20", " ")

  console.log(fileName)

  if (files.includes(fileName)) {

    const stat = fs.statSync(path.join(download_folder_path, fileName));

    res.writeHead(200, {
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': `attachment; filename=${fileName}`,
      'Content-Length': stat.size
    });

    const readStream = fs.createReadStream(path.join(download_folder_path, fileName));
    readStream.pipe(res);

    readStream.on('error', (err) => {
      console.error('File read error:', err);
      res.end('Internal Server Error');
    });

  } else {
    res.writeHead(504);
    res.end("No such file found");
  }
}

function handleHTML(req, res) {
  res.writeHead(200, {
    'Content-Type': 'text/html'
  })
  res.end(fs.readFileSync("index.html"))
}

function sizeConverted(size) { // stolen function

  if (size == 0) return "0 Bytes"

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];

  const i = Math.floor(Math.log(size) / Math.log(k));

  return parseFloat((size / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

server.listen(PORT, () => {
  console.log(`File server running at http://localhost:${PORT}/`);
});