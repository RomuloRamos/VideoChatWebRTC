class Recorder {
    constructor(userName, stream){
        this.userName = userName;
        this.stream = stream;

        this.fileName = `id:${userName}-when:${Date.now()}`;
        this.videoType = 'video/webm';

        this.mediaRecorder = {};//instance of Media Recorder class
        this.recorderBlobs = [];//binary data from video recording
        this.completeRecordings = [];
        this.recordingActive =  false;//if there is a recording occuring
    }

    _setup(){

//         var types = ["video/webm",
//              "audio/webm",
//              "video/webm\;codecs=vp8",
//              "video/webm\;codecs=daala",
//              "video/webm\;codecs=h264",
//              "audio/webm\;codecs=opus",
//              "video/mpeg"];

// for (var i in types) {
//   console.log( "Is " + types[i] + " supported? " + (MediaRecorder.isTypeSupported(types[i]) ? "Maybe!" : "Nope :("));
// }

        const commonCodecs = [
            "codecs=vp8, opus",
            "codecs=daala, opus",
            "codecs=h264, opus",
            "codecs=opus, opus",
            ""
            ];

        const options = commonCodecs
            .map(codec => ({mineType: `${this.videoType};${codec}`}))
            .find(options => MediaRecorder.isTypeSupported(options));

        // if(!options){
        //     throw new Error(`none of the codecs: ${commonCodecs.join(',')} are supported`);
        // }

        // return options;
        return {mineType: 'video/webm; codecs="h264, opus"'}
    }

    startRecording(){
        const options = this._setup();
        //se não estiver recebendo video, ignora...
        if(!this.stream.active) return;
         console.log('recording', this.userName, this.fileName);
        this.mediaRecorder = new MediaRecorder(this.stream, options);
        console.log(`Created MediaRecorder ${this.mediaRecorder} with options ${options}`);

        this.mediaRecorder.onstop = (event) =>{
            console.log('Recorded Blobs ', this.recorderBlobs);
        }

        this.mediaRecorder.ondataavaliable = (event)=>{
            if(!event.data || !event.data.size) return;

            this.recorderBlobs.push(event.data); 
        }

        this.mediaRecorder.start()
        console.log(`Media Recorded started`, this.mediaRecorder);
        this.recordingActive = true;
    }

    async stopRecording(){
        if(!this.recordingActive) return;
        if(this.mediaRecorder.state === 'inactive') return;

        console.log('Media recorded stopped!', this.userName);
        this.mediaRecorder.stop();

        this.recordingActive = false;
        await Util.sleep(200);
        this.completeRecordings.push([...this.recorderBlobs]);
        this.recorderBlobs = [];
    }

    getAllVideoURLs() {
        return this.completeRecordings.map( recording =>{
            const superBuffer = new Blob(recording, {type:this.videoType});


            return window.URL.createObjectURL(superBuffer);
        });
    }

    download(){
        if(!this.completeRecordings.length) return;

        for(const recording of this.completeRecordings){
            const blob = new Blob(recording, {type: this.videoType});
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = `${this.fileName}.webm`;
            document.body.appendChild(a);
            a.click();
        }
    }

}