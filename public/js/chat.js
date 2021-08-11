const socket = io()

// Elements
const $msgForm = document.querySelector('#message-form')
const $msgFormInput = $msgForm.querySelector('input')
const $msgFormButton = $msgForm.querySelector('button')
const $locationSend = document.querySelector('#send-location')
const $chatbox = document.querySelector('#chatbox')

//templates
const msgTemplate = document.querySelector('#message-template').innerHTML
const locmsgTemplate = document.querySelector('#locmessage-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

//options
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true})

const autoscroll = () => {
    // New message element
    const $newMessage = $chatbox.lastElementChild

    // Height of the new message
    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    //visible height
    const visibleHeight = $chatbox.offsetHeight

    //height of message container
    const containerHeight = $chatbox.scrollHeight

    //How far have I scrolled?
    const scrollOffset = $chatbox.scrollTop + visibleHeight

    if(containerHeight - newMessageHeight <= scrollOffset) {
        $chatbox.scrollTop = $chatbox.scrollHeight
    }
}

socket.on('message', (msg) => {
    console.log(msg)
    const html = Mustache.render(msgTemplate, {
        username: msg.username,
        msg: msg.text,
        createdAt: moment(msg.createdAt).format('h:mm a')
    })
    $chatbox.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

socket.on('locMessage', (msg) => {
    console.log(msg)

    const html = Mustache.render(locmsgTemplate, {
        username: msg.username,
        url: msg.url,
        createdAt: moment(msg.createdAt).format('h:mm a')
    })
    $chatbox.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

socket.on('roomData', ({ room, users}) => {
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    })
    document.querySelector('#sidebar').innerHTML = html
})

$msgForm.addEventListener('submit', (e) => {
    e.preventDefault()

    $msgFormButton.setAttribute('disabled', 'disabled')
    //disable
    const message = e.target.elements.message.value

    socket.emit('sendMessage', message, (error) => {
        //enable
        $msgFormButton.removeAttribute('disabled')
        $msgFormInput.value = ''
        $msgFormInput.focus()

        if(error){
            return console.log(error)
        }
        console.log("Message went delivered.")
    })
})

$locationSend.addEventListener('click', () => {
    if(!navigator.geolocation){
        return alert('Geolocation is not supported')
    }

    $locationSend.setAttribute('disabled', 'disabled')

    navigator.geolocation.getCurrentPosition((pos) => {
        socket.emit('sendLocation', {
            lat: pos.coords.latitude,
            long: pos.coords.longitude
         }, (error) => {
            $locationSend.removeAttribute('disabled')
            if(error){
                return console.log(error)
            }
            console.log("Location was shared.")
         })
    })
})

socket.emit('join', {username, room}, (error) => {
    if(error) {
        alert(error)
        location.href = '/'
    }
})