var firebaseConfig = {
    apiKey: "AIzaSyDEB2hXFMUUViqUQgzbel98-xFgRRVlqVk",
    authDomain: "train-scheduler-1a1e7.firebaseapp.com",
    databaseURL: "https://train-scheduler-1a1e7.firebaseio.com",
    projectId: "train-scheduler-1a1e7",
    storageBucket: "",
    messagingSenderId: "76902775404",
    appId: "1:76902775404:web:b6cfdba615bc5013"
};

firebase.initializeApp(firebaseConfig);

var database = firebase.database();

var app = {
    init(){
        $('.timepicker').timepicker({
            twelveHour: false,
        });

        var cleave = new Cleave('#train_init', {
            time: true,
            timePattern: ['h', 'm']
        });

        var minutes = new Cleave('#train_freq', {
            numericOnly: true,
            blocks: [6],
        });
    },
    addTrain(){
        event.preventDefault();
        var name = $('#train_name').val().trim();
        var dest = $('#train_dest').val().trim();
        var init = $('#train_init').val();
        var freq = $('#train_freq').val();

        console.log(name, dest, init, freq);

        database.ref().push({
            name,
            dest,
            init,
            freq,
        });
    },
    minutesToHours(mins){
        var h = mins / 60 | 0,
            m = mins % 60 | 0;

        if (h === 0){
            return m + 'm';
        } else if (m === 0 && h > 0){
            return h + 'h';
        } else {
            return h + 'h ' + m + 'm';
        }
    },
    tableRow(s, key){
        var tr = $('<tr>').attr('id', key);
        var frequency = this.minutesToHours(s.freq);
        var info = [s.name, s.dest, frequency, ' ', ' '];
        
        var x;
        for (x of info) {
            tr.append( $('<td>').text(x) );
        }

        tr.prependTo('#trains');
    }
}

$(document).ready(function(){

    app.init();

    $('#submit').on('click', app.addTrain);

    database.ref().on("child_added", function(snapshot) {
        var key = snapshot.key;
        app.tableRow(snapshot.val(), key);
    
      }, function(errorObject) {
        console.log("Errors handled: " + errorObject.code);
    });

});