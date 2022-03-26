
const inputs = document.getElementsByClassName('datePicker')
for (const input of inputs) {
    input.value = `${new Date().getFullYear()}-${("0" + (new Date().getMonth() + 1)).slice(-2)}-${("0" + new Date().getDate()).slice(-2)}`
}

