class Webcast {
    //Set global variable
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

    //Fill Select input whith file names in video folder
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

    //Set src video with selected file
    readVideoFile()
    {
        this.$webcast.querySelector('button.webcast-read-video-file-btn').disabled = true
        this.$video.controls = true
        this.$video.src = `./video/${this.$selectVideo.value}`
        this.$webcast.querySelector('.webcast-video-container').appendChild(this.$video)
        this.unlockButton('timing')
    }

    //Unlock timing button
    unlockButton(group)
    {
        this.$webcast.querySelector('button.webcast-start-time-btn').disabled = false
        this.$webcast.querySelector('button.webcast-end-time-btn').disabled = false
        this.listenTimeInput()
    }

    //Set value of input with $video current time
    setTimeInput(inputID)
    {
        this.$webcast.querySelector(`input#${inputID}`).value = this.$video.currentTime
        this.verifyTimeInput()
    }

    //Listen time input to verify if start < end
    listenTimeInput()
    {
        this.$inputStartTime.addEventListener('change', () => this.verifyTimeInput())
        this.$inputStartTime.addEventListener('keydown', () => this.verifyTimeInput())
        this.$inputEndTime.addEventListener('change', () => this.verifyTimeInput())
        this.$inputEndTime.addEventListener('keydown', () => this.verifyTimeInput())
    }

    //Verify time input and unlock analyze button
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

    //Launch set telemetry zone of video in canvas and launch tesseract analyze
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

    //Seek in video
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

    //Draw telemetry zone in canvas
    drawVideoTelemetry()
    {
        this.ctx.drawImage(this.$video, this.telemetryZone.x, this.telemetryZone.y, this.telemetryZone.w, this.telemetryZone.h, 0, 0, this.telemetryZone.w, this.telemetryZone.h)
    }

    //Analyze canvas with Tesseract
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
                this.arrayTextAnalyzed.push(textAnalyzedFormat)
                this.progressBarUpdate()
                resolve()
            })
        })
    }

    //Launch analyze and go to next frame
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

    //Format text with regex to return an object with speed, altitude, stage and time
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
                this.errorEncounter = 0
                obj.time = Math.floor(this.$video.currentTime - this.startTime)
                return obj
            }
            else
            {
                if(++this.errorEncounter <= this.settingsAnalyze.numberOfErrorAccepted)
                {
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
                return {speed: lastInput.speed, altitude: lastInput.altitude, stage: lastInput.stage, time: Math.floor(this.$video.currentTime - this.startTime)}
            }
            else
            {
                return this.setDataNotAvailable()
            }
        }
    }

    //Set data not available to old item if there is more than 5 problems
    setDataNotAvailable()
    {
        for(let i = 1; i <= this.settingsAnalyze.numberOfErrorAccepted; i++)
        {
            let oldTime = this.arrayTextAnalyzed[this.arrayTextAnalyzed.length-i].time
            this.arrayTextAnalyzed[this.arrayTextAnalyzed.length-i] = {error: 'Data not available', time: oldTime}
        }
        return {error: 'Data not available', time:Math.floor(this.$video.currentTime - this.startTime)}
    }

    //Calculate total step during the analyze with Tesseract
    calcTotalStepForAnalyze()
    {
        this.totalStepForAnalyze = this.settingsAnalyze.numberOfStepTesseract
        this.totalStepForAnalyze += Math.floor((this.endTime - this.startTime) / this.settingsAnalyze.step)+1
        if((this.endTime - this.startTime) % this.settingsAnalyze.step != 0)
        {
            this.totalStepForAnalyze++
        }
    }

    //Update progress bar when a new step is passed
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

    //Go to step section: hide analyze section and generate a first step
    stepSection()
    {
        this.$telemetrySection.style.display = 'none'
        this.$stepSection.style.display = 'flex'
        this.$webcast.querySelector('.webcast-json-btn-section').style.display = 'flex'
        this.$video.controls = true
        this.$video.currentTime = this.startTime
        this.generateNewStep()
    }

    //Generate a new step form to HTML content
    generateNewStep()
    {
        const stepHTML = `<div class="col-md-6 webcast-step webcast-step-${this.stepId}" data-step-id="${this.stepId}">
            <div class="form-group">
                <label for="webcast-step-name-${this.stepId}">Step ${this.stepId}</label>
                <select class="form-control" id="webcast-step-name-${this.stepId}" name="step-${this.stepId}-name">
                    <option value="Liftoff">Liftoff</option>
                    <option value="Max-Q">Max-Q</option>
                    <option value="Main engine cutoff">Main engine cutoff</option>
                    <option value="Stage 1 Boostback">Stage 1 Boostback</option>
                    <option value="Stage 1 entry burn">Stage 1 entry burn</option>
                    <option value="Stage 1 landing">Stage 1 landing</option>
                    <option value="Stage 2 Engine cutoff">Stage 2 Engine cutoff</option>
                    <option value="Deploy">Deploy</option>
                </select>
            </div>
            <div class="form-group">
                <div class="input-group">
                    <input type="number" class="form-control" id="webcast-step-time-${this.stepId}" name="step-${this.stepId}-startTime" value="0">
                    <span class="input-group-btn">
                        <button class="btn btn-primary webcast-step-time-btn-${this.stepId}" type="button" onclick="webcast.setTimeInput('webcast-step-time-${this.stepId}')">Set</button>
                    </span>
                </div>
            </div>
            <div class="form-group">
                <textarea class="form-control" id="webcast-step-description-${this.stepId}" name="step-${this.stepId}-description" rows="3" placeholder="Description"></textarea>
            </div>
        </div>`
        this.$stepSection.querySelector('.webcast-step-btn').insertAdjacentHTML('beforebegin', stepHTML)
        this.stepId++
    }

    //Remove last step from HTML content
    removeLastStep()
    {
        if(this.stepId > 1)
        {
            this.$stepSection.querySelector(`.webcast-step-${--this.stepId}`).remove()
        }

    }

    //Generate JSON with data inputs, telemetry data from analyze, steps data, ...
    generateJSON()
    {
        const namesOfData = ['name', 'id', 'date', 'hour', 'rocket', 'success', 'place', 'description', 'startTime', 'endTime']
        const namesOfDataStep = ['name', 'startTime', 'description']

        const obj = {}

        for(const name of namesOfData)
        {
            let value = this.$webcast.querySelector(`[name=${name}]`).value
            if(/Time/.test(name))
            {
                value = Math.floor(parseFloat(value))
            }
            else if(name == 'success')
            {
                value = (value == '1')
            }
            obj[name] = value
        }
        obj["telemetry"] = this.arrayTextAnalyzed
        const arraySteps = []
        for(let i = 0; i <= this.stepId - 1; i++)
        {
            const stepContainer = this.$stepSection.querySelector(`.webcast-step-${i}`)
            const objStep = {}
            for(const name of namesOfDataStep)
            {
                let value = stepContainer.querySelector(`[name=step-${i}-${name}]`).value
                if(/Time/.test(name))
                {
                    value = Math.floor(parseFloat(value) - this.startTime)
                }
                objStep[name] = value
            }
            arraySteps.push(objStep)
        }
        obj["steps"] = arraySteps
        const finalJSON = JSON.stringify(obj)
        this.$webcast.querySelector('.webcast-entries').style.display = 'none'
        this.$webcast.querySelector('.webcast-result').style.display = 'block'
        this.$webcast.querySelector('.webcast-result textarea').textContent = finalJSON
        let file = new File([finalJSON], this.$webcast.querySelector('[name=id]').value+'.json', {type: 'application/json'})
        saveAs(file)
    }
}