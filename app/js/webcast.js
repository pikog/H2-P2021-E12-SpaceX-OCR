class Webcast {
    constructor()
    {
        this.$webcast = document.querySelector('.webcast')
        this.$video = document.createElement('video')
        this.$selectVideo = this.$webcast.querySelector('select#webcast-video-name')

        this.$inputStartTime = this.$webcast.querySelector('input#webcast-start-time')
        this.startTime
        this.$inputEndTime = this.$webcast.querySelector('input#webcast-end-time')
        this.endTime

        this.$telemetrySection = this.$webcast.querySelector('.webcast-telemetry-section')

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

        this.$stepSection = this.$webcast.querySelector('.webcast-step-section')
        this.stepId = 0

        this.completeSelectVideo()
    }

    completeSelectVideo()
    {
        for(const fileName of arrayVideoName)
        {
            const $option = document.createElement("option")
            $option.value = fileName
            $option.textContent = fileName
            this.$selectVideo.appendChild($option)
        }
    }

    readVideoFile()
    {
        this.$video.controls = true
        this.$video.src = `./video/${this.$selectVideo.value}`
        this.$webcast.querySelector('.webcast-video-container').appendChild(this.$video)
        this.unlockButton('timing')
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
                this.$webcast.querySelector('button.webcast-launch-analyze-btn').disabled = false
                this.startTime = inputStartTimeValue
                this.endTime = inputEndTimeValue
            }
            else
            {
                this.$webcast.querySelector('button.webcast-launch-analyze-btn').disabled = true
            }
        }
    }

    launchAnalyze()
    {
        this.$telemetrySection.style.display = 'flex'
        this.$webcast.querySelector('button.webcast-launch-analyze-btn').disabled = true
        this.analyzeOngoing = true
        this.$canvas.width = this.telemetryZone.w
        this.$canvas.height = this.telemetryZone.h
        this.$telemetrySection.querySelector('.webcast-canvas-container').appendChild(this.$canvas)
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

    drawVideoTelemetry()
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
            this.drawVideoTelemetry()
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
        }).then(() => 
        {
            console.log(this.arrayTextAnalyzed)
            window.setTimeout(() =>
            {
                this.stepSection()
            }, 3000)
        })
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
        if(text.length >= 4  && text.length <= 7)
        {
            let lineData = 2
            if(text[1].length == 0)
            {
                lineData++
            }
            let countNumber = 0
            for(const char of text[lineData]) {
                if(/^\d/.test(char)) { countNumber++ }
            }
            
            if(countNumber >= 4)
            {
                text[lineData] = text[lineData].replace(/[D|o|O]/g, "0")
                text[lineData] = text[lineData].replace(/ /g, "")
                text[lineData] = text[lineData].replace(/S/g, "5")
                text[lineData] = text[lineData].replace(/B/g, "8")
                if(/(^[\d]{5})/.test(text[lineData]))
                {
                    obj.speed = parseInt(RegExp.$1)
                    text[lineData] = text[lineData].slice(5)
                    if(/(^[\d]{2}).*([\d]$)/.exec(text[lineData]))
                    {
                        obj.altitude = parseFloat(`${RegExp.$1}.${RegExp.$2}`)
                    }
                    else
                    {
                        obj.altitude = lastInput.altitude
                        console.log("1", Math.floor(this.$video.currentTime - this.startTime))
                    }
                }
                else
                {
                    obj.speed = lastInput.speed
                    obj.altitude = lastInput.altitude
                    console.log("2", Math.floor(this.$video.currentTime - this.startTime))
                }
            }
            else
            {
                obj.speed = lastInput.speed
                obj.altitude = lastInput.altitude
                console.log("3", Math.floor(this.$video.currentTime - this.startTime))
            }
        
            if(/^stage ?([1|2])/i.test(text[0]))
            {
                obj.stage = parseInt(RegExp.$1)
            }
            else
            {
                obj.stage = lastInput.stage
                console.log("4", Math.floor(this.$video.currentTime - this.startTime))
            }

            if(obj.speed != undefined && obj.altitude != undefined && obj.stage != undefined)
            {
                this.errorEncounter = 0
                obj.time = Math.floor(this.$video.currentTime - this.startTime)
                return obj
            }
            else
            {
                if(++this.errorEncounter <= this.settingsAnalyze.numberOfErrorAccepted)
                {
                    console.log("5", Math.floor(this.$video.currentTime - this.startTime))
                    return {speed: lastInput.speed, altitude: lastInput.altitude, stage: lastInput.stage, time: Math.floor(this.$video.currentTime - this.startTime)}
                }
                else
                {
                    return this.setDataNotAvailable()
                }
            }
        }
        else
        {
            if(++this.errorEncounter <= this.settingsAnalyze.numberOfErrorAccepted)
            {
                console.log("6", Math.floor(this.$video.currentTime - this.startTime))
                return {speed: lastInput.speed, altitude: lastInput.altitude, stage: lastInput.stage, time: Math.floor(this.$video.currentTime - this.startTime)}
            }
            else
            {
                return this.setDataNotAvailable()
            }
        }
    }

    setDataNotAvailable()
    {
        for(let i = 1; i <= this.settingsAnalyze.numberOfErrorAccepted; i++)
        {
            let oldTime = this.arrayTextAnalyzed[this.arrayTextAnalyzed.length-i].time
            this.arrayTextAnalyzed[this.arrayTextAnalyzed.length-i] = {error: 'Data not available', time: oldTime}
        }
        return {error: 'Data not available', time:Math.floor(this.$video.currentTime - this.startTime)}
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

    stepSection()
    {

        this.$telemetrySection.style.display = 'none'
        this.$stepSection.style.display = 'flex'
        this.$video.controls = true
        this.generateNewStep()
    }

    generateNewStep()
    {
        const stepHTML = `<div class="col-md-6 webcast-step webcast-step-${this.stepId}">
            <div class="form-group">
                <label for="webcast-step-name-${this.stepId}">Step ${this.stepId}</label>
                <select class="form-control" id="webcast-step-name-${this.stepId}">
                    <option value="Startup">Startup</option>
                    <option value="Liftoff">Liftoff</option>
                    <option value="Max-Q">Max-Q</option>
                    <option value="Main engine cutoff">Main engine cutoff</option>
                </select>
            </div>
            <div class="form-group">
                <div class="input-group">
                    <input type="number" class="form-control" id="webcast-step-time-${this.stepId}" value="0">
                    <span class="input-group-btn">
                        <button class="btn btn-primary webcast-step-time-btn-${this.stepId}" type="button" onclick="webcast.setTimeInput('webcast-step-time-${this.stepId}')">Set</button>
                    </span>
                </div>
            </div>
            <div class="form-group">
                <textarea class="form-control" id="webcast-step-description-${this.stepId}" rows="3" placeholder="Description"></textarea>
            </div>
        </div>`
        this.$stepSection.querySelector('.webcast-step-btn').insertAdjacentHTML('beforebegin', stepHTML)
        this.stepId++
    }

    removeLastStep()
    {
        if(this.stepId > 1)
        {
            this.$stepSection.querySelector(`.webcast-step-${--this.stepId}`).remove()
        }

    }
}