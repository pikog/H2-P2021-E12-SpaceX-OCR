// const $canvas = document.querySelector('canvas')
// const ctx = $canvas.getContext('2d')
// const $video = document.querySelector('video')
// let arrayText = []

// // const image = document.createElement('img')
// // image.addEventListener('load', () =>
// // {
// //     goOCR()
// // })

// // image.src = 'img/spacex2.png'

// $video.addEventListener('load', () =>
// {
//     $canvas.width = $video.width
//     $canvas.height = $video.height
// })

// const getScreenshot = () =>
// {
//     ctx.drawImage($video, 0, 0, $video.width, $video.height)
//     Tesseract.recognize(ctx)
//     .then(function(result){
//         console.log(result)
//         arrayText.push(result.text)
//         if($video.currentTime + 10 <= $video.duration)
//         {
//             $video.currentTime += 10
//             $video.addEventListener('canplaythrough', () =>
//             {
//                 getScreenshot()
//             })
//             console.log($video.currentTime)
//         }
//         else
//         {
//             console.log(arrayText)
//         }
//     })
// }

const $videoButton = document.querySelector('.videoButton')
let videoFile
const $video = document.createElement('video')
$video.controls = true
$video.preload = "auto"
const $canvas = document.createElement('canvas')
const ctx = $canvas.getContext('2d')

$videoButton.addEventListener('click', () =>
{
    videoFile = document.querySelector('input#video').files[0]
    console.log(document.querySelector('input#video').files[0])
    const reader = new FileReader();
    reader.readAsDataURL(videoFile)
    reader.addEventListener('load', () => {
        document.querySelector('.videoSection').appendChild($video)
        $video.addEventListener('canplay', () =>
        {
            $canvas.width = 462
            $canvas.height = 68
            //document.querySelector('.canvasSection').appendChild($canvas)
            ctx.drawImage($video, 1450, 6, 462, 68, 0, 0, 462, 68)
        })
        $video.src = reader.result
    })
})

