const configBox = document.querySelector('.config-box');;
const editor = document.querySelector('.editor');
const overlay = document.querySelector('.overlay');
var getJsStr = document.querySelector('.editor pre');
var flag = '';


function testFred() {
  const shell = require('electron').shell;
  const path = require('path');
  
  shell.openItem('./resources/app/config-replace.js');
  // const {shell} = require('electron')

  // shell.openItem('C:\Users\James.Watson\Desktop\test.txt')
  // console.log('Function running.');
}

document.querySelector('.fa-cogs').addEventListener('click', () => {
    configBox.style.display = (configBox.style.display === 'block') ? 'none' : 'block';
});
document.querySelector('.clear-sql').addEventListener('click', () => {
  document.querySelector('.sql-server').textContent = 'SQL SERVER SCRIPT WILL DISPLAY HERE';
  document.querySelector('.informix').textContent = 'INFORMIX SCRIPT WILL DISPLAY HERE';
});
document.querySelector('.replace-chars').addEventListener('click', () => {
  editor.style.display = 'block';
  configBox.style.display = 'none';
  flag = 'replace';
  readFile('./resources/app/config-replace.js');
});
document.querySelector('.remove-lines').addEventListener('click', () => {
  editor.style.display = 'block';
  configBox.style.display = 'none';
  flag = 'remove';
  readFile('./resources/app/config-remove-line.js');
});
document.querySelector('.x').addEventListener('click', () => {
    overlay.style.display = 'none';
    editor.style.display = 'none';
    configBox.style.display = 'none';
});
document.querySelector('.save-js').addEventListener('click', () => {
  let str = purifyText();
  if (flag === 'replace') {
    editJson(getJsStr.innerHTML.toString(), './resources/app/config-replace.js');
  } else {
    editJson(getJsStr.innerHTML.toString(), './resources/app/config-remove-line.js');
  }
});

function editJson (str, filePath) {
  var fs = require('fs')
  var filepath = filePath;
  var content = str

  fs.writeFile(filepath, content, (err) => {
    if (err) {
      alert('An error ocurred updating the file' + err.message)
      console.log(err)
      return
    }

    alert('The file has been succesfully saved')
  })
}

function readFile (filePath) {
  var remote = require('electron').remote
  var dialog = remote.dialog
  var fs = require('mz/fs')

  fs.readFile(filePath, 'utf-8').then(contents => {
    content = contents
    document.querySelector('.editor pre').textContent = contents;
  }).catch(err => console.error('An error ocurred reading the file: ' + err))
}






function purifyText() {
  let element = getJsStr;
  let firstTag = element.firstChild.nodeName;
  let keyTag = new RegExp(
    firstTag === '#text' ? '<br' : '</' + firstTag,
    'i'
  );
  let tmp = document.createElement('pre');
  tmp.innerHTML = element.innerHTML
    .replace(/<[^>]+>/g, (m, i) => (keyTag.test(m) ? '{ß®}' : ''))
    .replace(/{ß®}$/, '');
  return tmp.innerText.replace(/{ß®}/g, '\n');
}