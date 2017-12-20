// const $videoButton = document.querySelector('.videoButton')
// let videoFile
// const $video = document.createElement('video')
// $video.controls = true
// $video.preload = "auto"


// const setTimeBtn = (id) =>
// {
//     document.querySelector(`input#${id}`).value = $video.currentTime
// }

let webcast

const createWebcast = (videoInputID) =>
{
    webcast = new Webcast(videoInputID)
    document.querySelector('button.webcast-create-btn').disabled = true
}