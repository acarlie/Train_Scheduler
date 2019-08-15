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
            initDate = moment(initialTrain, "HH:mm").subtract(1, "years"),
            init = moment(initDate).format('X');
            console.log(init);

        database.ref().push({
            name,
            dest,
            init,
            freq,
        });

        app.resetVal(arr);
        
    },
    editTrain(){
        var x = $(this),
            key = x.attr('data-key'),
            name = x.attr('data-name'),
            dest = x.attr('data-dest'),
            freq = x.attr('data-freq'),
            init = x.attr('data-init'),
            initMT = moment(init, 'X').format('HH:mm'),
            initDate = moment(init, 'X').format('MM/DD/YYYY');

        console.log(key, name, dest, freq, init);

        $('#editTrainSubmit').attr('data-edit-key', key).attr('data-edit-date', initDate);

        $('#edit_train_name').val(name).siblings().addClass('active');
        $('#edit_train_dest').val(dest).siblings().addClass('active');
        $('#edit_train_freq').val(freq).siblings().addClass('active');
        $('#edit_train_init').val(initMT).siblings().addClass('active');

    },
    editTrainSubmit(){
        var key = $(this).attr('data-edit-key');
        var date = $(this).attr('data-edit-date');
        var arr = ['#edit_train_name', '#edit_train_dest', '#edit_train_freq', '#edit_train_init'],
            vals = app.setVal(arr),
            name = vals[0],
            dest = vals[1],
            freq = vals[2],
            initialTrain = vals[3],
            initTrainString = date + ' ' + initialTrain,
            initDate = moment(initTrainString, 'MM/DD/YYYY HH:mm'),
            init = moment(initDate).format('X');

            console.log('Hello');
        database.ref().child(key).set({
            name,
            dest,
            init,
            freq,
        });
    },
    deleteTrain(){
        var key = $(this).attr('data-key');
        database.ref().child(key).remove();
        $(this).parent().parent().remove();
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

        var diff = moment().diff(moment(init, 'X'), "minutes"),
            remn = diff % freq,
            away = freq - remn;
            awayFormatted = app.minutesToHours(away),
            next = moment().add(away, "minutes").format('hh:mm a');

            console.log(moment(init, 'X').format('MM/DD/YY'));
        return [next, awayFormatted];
    },
    tableRow(s, key){
        var tr = $('<tr>').addClass('train-info').attr('id', key),
            buttonClose = $('<button>').html('<i class="material-icons">close</i>').attr('data-key', key).addClass('btn-flat train-delete'),
            buttonEdit =  $('<button>').html('<i class="material-icons">edit</i>').attr('data-target', 'editTrainModal').attr('data-key', key).attr('data-name', s.name).attr('data-dest', s.dest).attr('data-freq', s.freq).attr('data-init', s.init).addClass('btn-flat train-edit modal-trigger'),
            freq = this.minutesToHours(s.freq),
            values = this.getValues(s.init, s.freq);
            info = [
                {info: s.name, id: key + 'name', class: ''}, 
                {info: s.dest, id: key + 'dest', class: ''}, 
                {info: freq, id: key + 'freq', class: ''},
                {info: values[0], id: key + 'next', class: ''},
                {info: values[1], id: key + 'away', class: ''},
                {info: buttonEdit, id: key + 'edit', class: 'table-col-sm'},
                {info: buttonClose, id: key + 'close', class: 'table-col-sm'}
            ];

        var x;
        for (x of info) {
            tr.append( $('<td>').html(x.info).attr('id', x.id).addClass(x.class) );
        }

        tr.attr('data-init', s.init).attr('data-freq', s.freq).prependTo('#trains');
    },
    timeUpdate(){
        $('.train-info').each(function(x, obj){
            var x = $(this),
                key = x.attr('id'),
                freq = x.attr('data-freq'),
                init = x.attr('data-init'),
                values = app.getValues(init, freq);

            $('#' + key + 'away').text(values[1]);
            $('#' + key + 'next').text(values[0]);       
        });
    }
}

$(document).ready(function(){

    app.init();

    $('.modal').modal();
    $('#submit').on('click', app.addTrain);

    $(document).on('click', '.train-edit', app.editTrain);
    $('#editTrainSubmit').on('click', app.editTrainSubmit);

    $(document).on('click', '.train-delete', app.deleteTrain);

    database.ref().on("child_added", function(snapshot) {
        var key = snapshot.key;
        app.tableRow(snapshot.val(), key);
      }, function(errorObject) {
        console.log("Errors handled: " + errorObject.code);
    });

    database.ref().on("value", function(snapshot) {
        var children = snapshot.numChildren();
        var snap = snapshot.val();
        var keys = Object.getOwnPropertyNames(snap);

        

        console.log(snap);
        console.log(children);
        console.log(keys);
        
        
    });
      

});