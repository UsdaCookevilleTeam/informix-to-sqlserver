document.querySelector('.fa-copy').addEventListener('click', () => copyToClipboard('.sql-server'));
document.querySelector('.fa-file').addEventListener('click', ()=> saveFile(strParse));

function readTextFile(filePath) {
	var fs  = require('fs');
  return fs.readFileSync(filePath).toString();
}

document.ondragover = document.ondrop = (ev) => {
  ev.preventDefault()
}

const getFile = document.querySelector('.get-file');

getFile.ondrop = (ev) => {
  let informixFile = ev.dataTransfer.files[0].path;
  displayConvert(informixFile);
  ev.preventDefault();
}

function displayConvert(file) {
  //C:/Users/James.Watson/Desktop/electron-v1.8.2-win32-x64/resources/app/statplan_prod.sql
  document.querySelector('.sql-server').textContent = func_BeginProcess(file.replace(/\\/g, '/'));
  console.log(file.replace(/\\/g, '/'));
  console.log(g_strSourceFileName);
  document.querySelector('.informix').textContent = readTextFile(file);
}

function copyToClipboard(text) {
  const {clipboard} = require('electron');
  var content = document.querySelector(text).innerHTML;
  clipboard.writeText(content);
  alert('The SQL is now copied to your clipboard.');
}

function saveFile(strToSave) {
  var remote = require('electron').remote;
  var dialog = remote.dialog;
  var fs = require('fs');
  let content = strToSave;

  dialog.showSaveDialog((fileName) => {
      if (fileName === undefined){
          console.log("You didn't save the file");
          return;
      }

      // fileName is a string that contains the path and filename created in the save file dialog.  
      fs.writeFile(fileName, content, (err) => {
          if(err){
              alert("An error ocurred creating the file "+ err.message)
          }
                      
          alert("The file has been succesfully saved");
      });
  }); 
}