class Webcast {
    constructor(videoInputID)
    {
        this.$webcast = document.querySelector('.webcast')
        this.$video = document.createElement('video')

        this.$inputStartTime = this.$webcast.querySelector('input#webcast-start-time')
        this.startTime
        this.$inputEndTime = this.$webcast.querySelector('input#webcast-end-time')
        this.endTime

        this.telemetryZone = {
            x: 1518,
            y: 75,
            w: 374,
            h: 216
        }

        this.settingsAnalyze = {
            step: 2,
            numberOfStepTesseract: 3,
            numberOfErrorAccepted: 5
        }

        this.$canvas = document.createElement('canvas')
        this.ctx = this.$canvas.getContext('2d')

        this.analyzeOngoing = false

        this.$progressBar = this.$webcast.querySelector('.webcast-progress-bar')
        this.$progressBarInner = this.$progressBar.querySelector('.progress-bar')
        this.totalStepForAnalyze = 0
        this.stepPassed = 0

        this.errorEncounter = 0
        this.arrayTextAnalyzed = []

        this.readVideoFile(this.$webcast.querySelector(`input#${videoInputID}`).files[0])
        this.unlockButton('timing')
    }

    readVideoFile(videoFile)
    {
        this.$video.controls = true
        this.$video.autoplay = true
        /*
        const reader = new FileReader()
        reader.addEventListener('load', () => {
            this.$video.src = reader.result
            this.$webcast.querySelector('.webcast-video-container').appendChild(this.$video)
        })
        reader.readAsDataURL(videoFile)
        */
        this.$video.src = 'http://localhost/dev/spacex/H2-P2021-E12-SpaceX-OCR/app/video/crs2.mp4'
        this.$webcast.querySelector('.webcast-video-container').appendChild(this.$video)
    }

    unlockButton(group)
    {
        if(group == 'timing') {
            this.$webcast.querySelector('button.webcast-start-time-btn').disabled = false
            this.$webcast.querySelector('button.webcast-end-time-btn').disabled = false
            this.listenTimeInput()
        }
    }

    setTimeInput(inputID)
    {
        this.$webcast.querySelector(`input#${inputID}`).value = this.$video.currentTime
        this.verifyTimeInput()
    }

    listenTimeInput()
    {
        this.$inputStartTime.addEventListener('change', () => this.verifyTimeInput())
        this.$inputStartTime.addEventListener('keydown', () => this.verifyTimeInput())
        this.$inputEndTime.addEventListener('change', () => this.verifyTimeInput())
        this.$inputEndTime.addEventListener('keydown', () => this.verifyTimeInput())
    }

    verifyTimeInput()
    {
        if(!this.analyzeOngoing)
        {
            const inputStartTimeValue = parseFloat(this.$inputStartTime.value)
            const inputEndTimeValue = parseFloat(this.$inputEndTime.value)
            if(inputStartTimeValue < inputEndTimeValue)
            {
                this.$webcast.querySelector('button.webcast-go-btn').disabled = false
                this.startTime = inputStartTimeValue
                this.endTime = inputEndTimeValue
            }
            else
            {
                this.$webcast.querySelector('button.webcast-go-btn').disabled = true
            }
        }
    }

    go()
    {
        this.$webcast.querySelector('button.webcast-go-btn').disabled = true
        this.analyzeOngoing = true
        this.$canvas.width = this.telemetryZone.w
        this.$canvas.height = this.telemetryZone.h
        this.$webcast.querySelector('.webcast-canvas-container').appendChild(this.$canvas)
        this.$video.autoplay = false
        this.$video.controls = false
        this.$video.pause()
        this.$progressBar.style.visibility = 'visible'
        this.calcTotalStepForAnalyze()
        this.loopAnalyze()
    }

    setVideoTime(time)
    {
        return new Promise((resolve) =>
        {
            if(time != undefined) {
                this.$video.currentTime = time
            }
            else
            {
                this.$video.currentTime = this.startTime
            }
            this.$video.addEventListener('canplay', () => resolve())
        })
    }

    drawVideo()
    {
        this.ctx.drawImage(this.$video, this.telemetryZone.x, this.telemetryZone.y, this.telemetryZone.w, this.telemetryZone.h, 0, 0, this.telemetryZone.w, this.telemetryZone.h)
    }

    analyzeCtx(ctx)
    {
        return new Promise((resolve) =>
        {
            Tesseract.recognize(ctx).progress((message) =>
            {
                if((message.status == 'loading tesseract core' || message.status == 'initializing tesseract' || message.status == 'loading eng.traineddata') && message.progress == 1) {
                    this.progressBarUpdate()
                }
            }).then((result) =>
            {
                let textAnalyzedFormat = this.formatText(result.text)
                textAnalyzedFormat.text = result.text
                textAnalyzedFormat.time = Math.floor(this.$video.currentTime - this.startTime)
                this.arrayTextAnalyzed.push(textAnalyzedFormat)
                this.progressBarUpdate()
                resolve()
            })
        })
    }

    loopAnalyze(time)
    {
        this.setVideoTime(time).then(() => 
        {
            this.drawVideo()
            return this.analyzeCtx(this.ctx)
        }).then(() => 
        {
            return new Promise((resolve) => {
                if(this.$video.currentTime != this.endTime)
                {
                    this.loopAnalyze(Math.min(this.$video.currentTime += this.settingsAnalyze.step, this.endTime))
                }
                else
                {
                    resolve()
                }
            })
        }).then(() => console.log(this.arrayTextAnalyzed))
    }

    formatText(text)
    {
        let lastInput
        if(this.arrayTextAnalyzed.length > 0)
        {
            lastInput = this.arrayTextAnalyzed[this.arrayTextAnalyzed.length-1]
        }
        else
        {
            lastInput = {stage: 2, speed: 0, altitude: 0}
        }
        let obj = {}
        text = text.split("\n")
        if(text.length >= 4)
        {
            this.errorEncounter = 0
            let countNumber = 0
            for(const char of text[2]) {
                if(/^\d/.test(char)) { countNumber++ }
            }
            
            if(countNumber >= 4 && countNumber <= 7)
            {
                text[2] = text[2].replace(/[D|o|O]/g, "0")
                text[2] = text[2].replace(/ /g, "")
                text[2] = text[2].replace(/S/g, "5")
                text[2] = text[2].replace(/B/g, "8")
                if(/(^[\d]{5})/.test(text[2]))
                {
                    obj.speed = parseInt(RegExp.$1)
                    text[2] = text[2].slice(5)
                    if(/(^[\d]{2}).*([\d]$)/.exec(text[2]))
                    {
                        obj.altitude = parseFloat(`${RegExp.$1}.${RegExp.$2}`)
                    }
                    else
                    {
                        obj.altitude = lastInput.altitude
                    }
                }
                else
                {
                    obj.speed = lastInput.speed
                    obj.altitude = lastInput.altitude
                }
            }
            else
            {
                obj.speed = lastInput.speed
                obj.altitude = lastInput.altitude
            }
        
            if(/^stage ?([1|2])/i.test(text[0]))
            {
                obj.stage = parseInt(RegExp.$1)
            }
            else
            {
                obj.stage = lastInput.stage
            }

            if(obj.speed != undefined && obj.altitude != undefined && obj.stage != undefined)
            {
                return obj
            }
            else
            {
                if(this.errorEncounter <= this.settingsAnalyze.numberOfErrorAccepted)
                {
                    this.errorEncounter++
                    return lastInput
                }
                else
                {
                    return {error: 'Data not available'}
                }
            }
        }
        else
        {
            if(this.errorEncounter <= this.settingsAnalyze.numberOfErrorAccepted)
            {
                this.errorEncounter++
                return lastInput
            }
            else
            {
                return {error: 'Data not available'}
            }
        }
    }

    calcTotalStepForAnalyze()
    {
        this.totalStepForAnalyze = this.settingsAnalyze.numberOfStepTesseract
        this.totalStepForAnalyze += Math.floor((this.endTime - this.startTime) / this.settingsAnalyze.step)+1
        if((this.endTime - this.startTime) % this.settingsAnalyze.step != 0)
        {
            this.totalStepForAnalyze++
        }
        console.log(this.totalStepForAnalyze)
    }

    progressBarUpdate()
    {
        if(this.stepPassed < this.totalStepForAnalyze)
        {
            this.stepPassed++
            const percent = (this.stepPassed / this.totalStepForAnalyze) * 100
            this.$progressBarInner.textContent = `${Math.floor(percent)}%`
            this.$progressBarInner.style.width = `${percent}%`
            if(this.stepPassed == this.totalStepForAnalyze)
            {
                this.$progressBarInner.classList.add('bg-success')
                this.$progressBarInner.classList.remove('bg-warning')
                this.$progressBarInner.classList.remove('progress-bar-animated')
            }
        }
    }
}