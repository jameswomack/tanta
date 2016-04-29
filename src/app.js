'use strict'
/* eslint-disable no-cond-assign, no-plusplus */

import yo        from 'yo-yo'
import imagediff from 'imagediff'

const TANTA_LOCALSTORAGE_KEY = 'womack.io.tanta.json'

document.addEventListener('DOMContentLoaded', function () {
  const $diff     = document.querySelector('canvas#diff')
  const $showDiff = document.querySelector('#show-diff')
  const $canvas   = document.getElementById('canvas')
  const $button   = document.getElementById('button')
  const $clear    = document.getElementById('clear')
  const $clearAll = document.getElementById('clear-all')
  const $toggle   = document.getElementById('toggle')
  const $video    = document.getElementById('video')
  const canvas    = $canvas.getContext('2d')
  let   autoOn    = false
  let   auto      = null

  $toggle.onclick = function () {
    autoOn = !autoOn

    if (autoOn) {
      $toggle.value = 'Turn Off Autosnap'
      auto = setInterval(function () {
        $button.click()
      }, 1000)
    } else {
      $toggle.value = 'Turn On Autosnap'
      clearInterval(auto)
    }
  }

  clearInterval(auto)


  function getImageDataURLs () {
    let deserializedLocalStorageEntry, serializedLocalStorageEntry

    if (serializedLocalStorageEntry = localStorage.getItem(TANTA_LOCALSTORAGE_KEY))
      deserializedLocalStorageEntry = JSON.parse(serializedLocalStorageEntry)
    else
      deserializedLocalStorageEntry = [ ]

    return deserializedLocalStorageEntry
  }

  function pushImageDataURL (dataURLToPush) {
    let deserializedLocalStorageEntry = getImageDataURLs()
    let serializedLocalStorageEntry
    deserializedLocalStorageEntry.push(dataURLToPush)
    serializedLocalStorageEntry = JSON.stringify(deserializedLocalStorageEntry)

    try {
      localStorage.setItem(TANTA_LOCALSTORAGE_KEY, serializedLocalStorageEntry)
    }

    catch (e) {
      if (e instanceof DOMException) {
        const $images = $imageCollection.querySelectorAll('img')
        const count = $images.length
        const eachWidth  = $canvas.width / Math.floor(Math.sqrt(count))
        const eachHeight = $canvas.height / Math.floor(Math.sqrt(count))
        let x = 0
        let y = 0
        let i = 0

        canvas.clearRect(0, 0, $canvas.width, $canvas.height)
        canvas.save()

        for (let $image of $images) {
          canvas.drawImage($image, x, y, eachWidth, eachHeight)
          console.info(i++, x, y, x + eachWidth, y + eachHeight)

          if (x + eachWidth < $canvas.width)
            x += eachWidth
          else {
            y += eachHeight
            x = 0
          }
        }

        canvas.restore()
        clearAll()
        updateImageListWithCurrentFrame()
      }

      console.error(e)
    }
  }

  function clearAll () {
    localStorage.setItem(TANTA_LOCALSTORAGE_KEY, JSON.stringify([]))
  }

  function createOverlay (imageDataURL) {
    return yo`<img src=${imageDataURL} id="overlay" />`
  }

  function setOverlayDataURL (imageDataURL) {
    $clear.disabled = !imageDataURL
    yo.update($overlay, createOverlay(imageDataURL || ''))
  }

  function showDiff () {
    const diff = imagediff.diff($canvas, $overlay)
    $diff.getContext('2d').putImageData(diff, 0, 0)
  }

  function createImageListItems () {
    return getImageDataURLs().map(imageDataURL => yo`<li><img src=${imageDataURL} onclick=${(e) => setOverlayDataURL(e.currentTarget.src)} /></li>`)
  }

  function createImageList () {
    const listItems = createImageListItems()
    return yo`<ul>${listItems}</ul>`
  }

  let $imageList
  let $imageCollection

  function updateImageListWithCurrentFrame () {
    const dataURLToPush = $canvas.toDataURL('image/png')
    pushImageDataURL(dataURLToPush)
    yo.update($imageList, createImageList())
  }

  const imageDataURLs = getImageDataURLs()
  const firstImageDataURL = imageDataURLs.length && imageDataURLs[0]
  document.getElementById('overlay') && document.getElementById('overlay').remove()
  const $overlay = createOverlay(firstImageDataURL)


  const p = navigator.mediaDevices.getUserMedia({ video: true })
  setInterval(function () {
    canvas.save()
    canvas.clearRect(0, 0, $canvas.width, $canvas.height)
    canvas.drawImage($video, 0, 0, 300, 224)
    canvas.globalAlpha = 0.5
    $overlay.style.opacity = '1'
    canvas.drawImage($overlay, 0, 0)
    $overlay.style.opacity = ''
    canvas.globalAlpha = 1
    canvas.drawImage($diff, 0, 0)
    canvas.restore()
  }, 1000 / 30)

  p.then(function (mediaStream) {
    $video.src = window.URL.createObjectURL(mediaStream);

    $video.onloadedmetadata = function () {
      $button.disabled  = false
      $clearAll.onclick = () => {
        clearAll()
        yo.update($imageList, createImageList())
      }

      $clear.onclick   = () => {
        setOverlayDataURL()
        $diff.getContext('2d').clearRect(0, 0, $diff.width, $diff.height)
      }

      $showDiff.onclick  = () => {
        showDiff()
      }

      $button.onclick  = () => {
        updateImageListWithCurrentFrame()
      }

      $video.play()

      $imageList = createImageList()
      $imageCollection = document.getElementById('image-collection')
      const $overlayContainer = document.getElementById('video-container')
      $overlayContainer.appendChild($overlay)
      for (let $child of $imageCollection.children)
        $child.remove()
      $imageCollection.appendChild($imageList)
    };
  })

  p.catch(console.error.bind(console))
})
