<?php
    $array_videos = array();
    foreach (scandir("./video") as $file)
    {
        if(!is_dir($file) && preg_match("/(\.mp4|\.ogg)$/i", $file))
        {
            array_push($array_videos, $file);
        }
    }
?>
<script type="text/javascript">
    const arrayVideoName = <?php echo json_encode($array_videos); ?>;
</script>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width,initial-scale=1,user-scalable=no">
    <title>SpaceXperience - Webcast OCR</title>
    <link rel="stylesheet" href="css/bootstrap.min.css">
    <link rel="stylesheet" href="css/style.css">
</head>
<body>

    <nav class="navbar navbar-dark bg-dark fixed-top">
        <a class="navbar-brand" href="#">SpaceXperience - Webcast OCR</a>
        <ul class="navbar-nav justify-content-end">
            <li class="nav-item">
                <a class="nav-link" href="#">Website</a>
            </li>
        </ul>
    </nav>

    <main class="container webcast">
        <div class="form-row">
            <div class="form-group col-lg col-sm-6">
                <label for="webcast-mission-name">Mission's name</label>
                <input type="text" class="form-control" id="webcast-mission-name" placeholder="Mission's Name">
            </div>
            <div class="form-group col-lg col-sm-6">
                <label for="webcast-mission-id">ID</label>
                <input type="text" class="form-control" id="webcast-mission-id" placeholder="ID">
            </div>
            <div class="form-group col-lg col-sm-6">
                <label for="webcast-mission-date">Date</label>
                <input type="date" class="form-control" id="webcast-mission-date" placeholder="Date">
            </div>
            <div class="form-group col-lg col-sm-6">
                <label for="webcast-mission-hour">Hour</label>
                <input type="time" class="form-control" id="webcast-mission-hour" placeholder="Hour">
            </div>
        </div>
        <div class="form-row">
            <div class="form-group col-lg col-sm-6">
                <label for="webcast-mission-rocket">Rocket</label>
                <select class="form-control" id="webcast-mission-rocket">
                    <option>Falcon 9</option>
                    <option>Falcon Heavy</option>
                    <option>Dragon</option>
                </select>
            </div>
            <div class="form-group col-lg col-sm-6">
                <label for="webcast-mission-success">Success</label>
                <select class="form-control" id="webcast-mission-success">
                    <option>True</option>
                    <option>False</option>
                </select>
            </div>
            <div class="form-group col-lg col-sm-12">
                <label for="webcast-mission-place">Place</label>
                <input type="time" class="form-control" id="webcast-mission-place" placeholder="Place">
            </div>
        </div>
        <div class="form-row">
            <div class="form-group col">
                <label for="webcast-mission-description">Description</label>
                <textarea class="form-control" id="webcast-mission-description" rows="3"></textarea>
            </div>
        </div>
        <div class="form-row">
            <div class="form-group col">
                <label for="webcast-video-name">Video</label>
                <div class="input-group">
                    <select class="form-control" id="webcast-video-name">
                    </select>
                    <span class="input-group-btn">
                        <button class="btn btn-primary webcast-read-video-file-btn" onclick="webcast.readVideoFile()" type="button">Go !</button>
                    </span>
                </div>
            </div>
        </div>
        <div class="row">
            <div class="col-lg-9 col-sm-12 webcast-video-container">
            </div>
            <div class="col-lg-3 col-sm-12">
                <div class="form-row">
                    <div class="form-group col-lg-12 col-sm-6">
                        <label for="webcast-start-time">Launch time</label>
                        <div class="input-group">
                            <input type="number" class="form-control" id="webcast-start-time" value="0">
                            <span class="input-group-btn">
                                <button class="btn btn-primary webcast-start-time-btn" type="button" onclick="webcast.setTimeInput('webcast-start-time')" disabled>Set</button>
                            </span>
                        </div>
                    </div>
                    <div class="form-group col-lg-12 col-sm-6">
                        <label for="webcast-end-time">End time</label>
                        <div class="input-group">
                            <input type="number" class="form-control" id="webcast-end-time" value="0">
                            <span class="input-group-btn">
                                <button class="btn btn-primary webcast-end-time-btn" type="button" onclick="webcast.setTimeInput('webcast-end-time')" disabled>Set</button>
                            </span>
                        </div>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group col">
                        <button class="btn btn-primary btn-lg btn-block webcast-launch-analyze-btn" type="button" onclick="webcast.launchAnalyze()" disabled>Go !</button>
                    </div>
                </div>
            </div>
        </div>
        <div class="row align-items-center webcast-telemetry-section" style="display: none;">
            <div class="col-lg-4 webcast-canvas-container">
            </div>
            <div class="col-lg-8">
                <div class="progress webcast-progress-bar">
                    <div class="progress-bar bg-warning progress-bar-striped progress-bar-animated" role="progressbar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100" style="width: 0%;">0%</div>
                </div>
            </div>
        </div>
        <div class="row webcast-step-section" style="display: none;">
            <div class="col-12 webcast-step-btn">
                <div class="row">
                    <div class="form-group col-sm-6">
                        <button class="btn btn-success btn-block webcast-step-add-btn" type="button" onclick="webcast.generateNewStep()">Add a step</button>
                    </div>
                    <div class="form-group col-sm-6">
                        <button class="btn btn-danger btn-block webcast-step-remove-btn" type="button" onclick="webcast.removeLastStep()">Remove last step</button>
                    </div>
                </div>
            </div>
        </div>
    </main>

    <script src='https://cdn.rawgit.com/naptha/tesseract.js/1.0.10/dist/tesseract.js'></script>
    <script src="js/webcast.js"></script>
    <script src="js/script.js"></script>
</body>
</html>