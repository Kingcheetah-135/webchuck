/* Connect IDE buttons to WebChucK */
var startButton = document.getElementById("startChuck");
var compileButton = document.getElementById("compileButton");
var replaceButton = document.getElementById("replaceButton");
var removeButton = document.getElementById("removeButton");
var micButton = document.getElementById("micButton");

/* Connect Shreds and Console to WebChucK */
var shredsToRows = {};
var shredsTable = document.getElementById("shredsTable");
var outputConsole = document.getElementById("console");

/* File handling */
var fileUploadButton = document.getElementById("fileUploadButton");
var fileUploader = document.getElementById("fileUploader");

// For preloading files 
var serverFilesToPreload = serverFilesToPreload || [];
var preloadedFilesReady = preloadFilenames(serverFilesToPreload);

// use named functions instead of anonymous ones
// so they can be replaced later if desired
var chuckCompileButton = function ()
{
    // send message to compile and play code
    theChuck.runCode(chuckEditor.getValue()).then(
        function (shredID)
        {
            addShredRow(shredID);
        },
        function (failure) { }
    );
};

var chuckReplaceButton = function ()
{
    // send message to replace last shred with this code
    theChuck.replaceCode(chuckEditor.getValue()).then(
        function (shreds)
        {
            removeShredRow(shreds.oldShred);
            addShredRow(shreds.newShred);
        },
        function (failure) { }
    );
};

var chuckRemoveButton = function ()
{
    // send message to remove most recent shred
    theChuck.removeLastCode().then(
        function (shred)
        {
            removeShredRow(shred);
        },
        function (failure) { }
    );
};

var chuckMicButton = function ()
{
    navigator.mediaDevices
        .getUserMedia({ audio: true, video: false })
        .then(function (stream)
        {
            micButton.disabled = true;
            const source = audioContext.createMediaStreamSource(stream);
            source.connect(theChuck);
        });
};

/* File handling */
var fileExplorer = new Set();
var fileUploadButtonClick = function () { fileUploader.click(); };

/* Upload Files via Button */
function handleFiles()
{
    var fileList = [...this.files];
    fileList.forEach(file =>
    {
        var reader = new FileReader();
        if (file.name.endsWith(".ck")) {
            reader.onload = e => {
                globalFileName = file.name;
                loadChuckFileFromString(e.target.result);
            }
            reader.readAsText(file);
        } 
        else 
        {
            reader.onload = function (e)
            {
                var data = new Uint8Array(e.target.result);
                theChuck.createFile("", file.name, data);
            };
            reader.readAsArrayBuffer(file);
        }

        // Add file to file explorer
        fileExplorer.add(file);

  
    });
    updateFileExplorer();
}
fileUploader.addEventListener("change", handleFiles, false);

/* Upload Files via Drag and Drop */
function uploadHandler(ev)
{
    console.log("File(s) dropped");
    ev.preventDefault(); // Prevent opening of file

    if (ev.dataTransfer.items) {
        // DataTransferItemList interface to process the file(s)
        [...ev.dataTransfer.items].forEach(item =>
        {
            if (item.kind === 'file') {
                const file = item.getAsFile();
                console.log('... file[' + file.name + '].');
                console.log(file.getValue());
            }
        });
    }
    displayFileExplorer();
}
function dragOverHandler(ev)
{
    console.log("dragOver");
    ev.preventDefault();

    // Set the dropEffect to move
    ev.dataTransfer.dropEffect = "move";
}

// Display file explorer
function updateFileExplorer()
{
    var fileExplorerElement = document.getElementById("file-explorer");
    fileExplorerElement.innerHTML = "";
    fileExplorer.forEach(file =>
    {
        var fileElement = document.createElement("div");
        fileElement.classList.add("file");
        // Add icon before file name
        var iconElement = "<i class='icon icon-upload'></i> "
        fileElement.innerHTML = iconElement + file.name;

        fileExplorerElement.appendChild(fileElement);
    });
}

startButton.addEventListener("click", async function ()
{
    startButton.disabled = true;
    await preloadedFilesReady;
    await startChuck();
});

// Button initial states
startButton.disabled = false;
compileButton.disabled = true;
replaceButton.disabled = true;
removeButton.disabled = true;
micButton.disabled = true;
fileUploadButton.disabled = true;

// Connect buttons to WebChucK
compileButton.addEventListener("click", chuckCompileButton);
replaceButton.addEventListener("click", chuckReplaceButton);
removeButton.addEventListener("click", chuckRemoveButton);
micButton.addEventListener("click", chuckMicButton);
fileUploadButton.addEventListener("click", fileUploadButtonClick);

// Once WebChucK is loaded, enable buttons
theChuckReady.then(function ()
{
    compileButton.disabled = false;
    replaceButton.disabled = false;
    removeButton.disabled = false;
    micButton.disabled = false;
    //uploadButton.disabled = false;
    fileUploadButton.disabled = false;
    outputConsole.value += "WebChucK is ready!\n";
});

// Override default print function, print to output console
// self invoking function
chuckPrint = function ()
{
    if (outputConsole) outputConsole.value = ""; // clear browser cache
    return function (text)
    {
        if (arguments.length > 1) {
            text = Array.prototype.slice.call(arguments).join(" ");
        }

        if (outputConsole) {
            outputConsole.value += text + "\n";
            outputConsole.scrollTop = outputConsole.scrollHeight; // focus on bottom
        }
    };
}();

// Add a row to the shreds table
function addShredRow(theShred)
{
    var row = shredsTable.insertRow();
    var cell0 = row.insertCell(0);
    var cell1 = row.insertCell(1);
    var cell2 = row.insertCell(2);
    var cell3 = row.insertCell(3);

    shredsToRows[theShred] = row;

    cell0.innerHTML = "" + theShred;
    cell1.innerHTML = chuckEditor.getValue().substring(0, 20) + "...";
    (function (cell, myShred)
    {
        var getTime = function ()
        {
            return Math.floor(Date.now() / 1000);
        };
        var formatTime = function (i)
        {
            // add zero in front of numbers < 10
            if (i < 10) {
                i = "0" + i;
            }
            return i;
        };

        var startTime = getTime();
        var removed = false;
        function updateTime()
        {
            var now = getTime();
            var elapsed = now - startTime;
            var m = Math.floor(elapsed / 60);
            var s = Math.floor(elapsed % 60);

            // piggyback off time keeper to remove row
            // if it stops running
            if (!(myShred in shredsToRows)) {
                removed = true;
            }
            theChuck.isShredActive(myShred).then(function (result)
            {
                if (!result && !removed) {
                    removed = true;
                    removeShredRow(myShred);
                    return;
                }
            });

            // only keep updating time if row still exists
            if (!removed && document.contains(cell)) {
                cell.innerHTML = formatTime(m) + ":" + formatTime(s);
                setTimeout(updateTime, 1000);
            }
        }
        updateTime();
    })(cell2, theShred);

    /* Create a remove button for the shred */
    var removeButton = document.createElement("INPUT");
    removeButton.setAttribute("type", "image");
    removeButton.setAttribute("src", "./assets/icons/remove.png");
    removeButton.classList.add("chuckButton");
    removeButton.setAttribute("alt", "remove button");
    cell3.appendChild(removeButton);

    removeButton.addEventListener(
        "click",
        (function (shredID)
        {
            return function ()
            {
                theChuck.removeShred(shredID).then(
                    function (removedShred)
                    {
                        removeShredRow(theShred);
                    },
                    function (failure)
                    {
                        console.log(failure);
                    }
                );
            };
        })(theShred)
    );
}
// Remove a single shred row from the table
function removeShredRow(theShred)
{
    if (theShred in shredsToRows) {
        shredsToRows[theShred].parentNode.removeChild(shredsToRows[theShred]);
        delete shredsToRows[theShred];
    }
}
