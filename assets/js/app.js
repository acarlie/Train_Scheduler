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

        new Cleave('#train_init', {
            time: true,
            timePattern: ['h', 'm']
        });

        this.interval = setInterval(this.timeUpdate, 60000);
    },
    addTrain(){
        event.preventDefault();
        var arr = ['#train_name', '#train_dest', '#train_freq', '#train_init'],
            vals = app.setVal(arr),
            name = vals[0],
            dest = vals[1],
            freq = vals[2],
            initialTrain = vals[3],
            init = moment(initialTrain, "HH:mm").subtract(1, "years").unix();

        database.ref().push({
            name,
            dest,
            init,
            freq,
        });

        app.resetVal(arr);
        
    },
    setVal(arr){
        var x;
        var result = [];
        for (x of arr){
            result.push( $(x).val().trim() );
        }
        return result;
    },
    resetVal(arr){
        var x;
        for (x of arr){
            $(x).val('');
        }
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
    getValues(init, freq){
        var first = moment().unix(init),
            diff = moment().diff(moment(first), "minutes"),
            remn = diff % freq,
            away = freq - remn;
            awayFormatted = app.minutesToHours(away),
            next = moment().add(away, "minutes").format('hh:mm a');

        return [next, awayFormatted];
    },
    tableRow(s, key){
        var tr = $('<tr>').addClass('train-info').attr('id', key),
            button = $('<button>').text('X').attr('data-key', key).addClass('train-delete'),
            freq = this.minutesToHours(s.freq),
            values = this.getValues(s.init, s.freq);
            info = [
                {info: s.name, id: key + 'name'}, 
                {info: s.dest, id: key + 'dest'}, 
                {info: freq, id: key + 'freq'},
                {info: values[0], id: key + 'next'},
                {info: values[1], id: key + 'away'},
                {info: button, id: key + 'close'}
            ];

        var x;
        for (x of info) {
            tr.append( $('<td>').html(x.info).attr('id', x.id) );
        }

        tr.attr('data-init', s.init).attr('data-freq', s.freq).prependTo('#trains');
    },
    timeUpdate(){
        $('.train-info').each(function(x, obj){
            var key = $(this).attr('id'),
                freq = $(this).attr('data-freq'),
                init = $(this).attr('data-init'),
                values = app.getValues(init, freq);

            $('#' + key + 'away').text(values[1]);
            $('#' + key + 'next').text(values[0]);       
        });
    },
    deleteTrain(){
        var key = $(this).attr('data-key');
        database.ref().child(key).remove();
        $(this).parent().parent().remove();
    }
}

$(document).ready(function(){

    app.init();

    $(document).on('click', '.train-delete', app.deleteTrain);

    $('#submit').on('click', app.addTrain);

    database.ref().on("child_added", function(snapshot) {
        var key = snapshot.key;
        app.tableRow(snapshot.val(), key);
      }, function(errorObject) {
        console.log("Errors handled: " + errorObject.code);
    });



});