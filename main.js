const tableToJoi = require('./table-to-joi');

function process() {
  try {
    const tableDeclaration = document.getElementById('tableDeclaration').value;
    const option = document.getElementById('optionObject').value;
    const result = tableToJoi(option, tableDeclaration);
    document.getElementById('result').value = result;
  } catch (error) {
    console.error(error);
    alert(`An error ocurred, make sure its a valid table declation`);
  }


}



document.addEventListener("DOMContentLoaded", function (event) {
  document.getElementById('processButton').onclick = process;
  document.getElementById('form').onsubmit = process;
});

