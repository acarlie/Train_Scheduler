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
    edited: '',
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

        if (name && dest && init && freq){
            database.ref().push({
                name,
                dest,
                init,
                freq,
            });
    
            app.resetInputs(arr);
        }
    },
    editTrain(){
        var x = $(this),
            key = x.attr('data-key'),
            name = x.attr('data-name'),
            dest = x.attr('data-dest'),
            freq = x.attr('data-freq'),
            initVal = x.attr('data-init'),
            init = moment(initVal, 'X').format('HH:mm'),
            initDate = moment(initVal, 'X').format('MM/DD/YYYY'),
            arr = [['name', name], ['dest', dest], ['freq', freq], ['init', init]];

        var i;
        for (i of arr){
            $('#edit_train_' + i[0]).val(i[1]).siblings().addClass('active');
        }
        
        $('#editTrainSubmit').attr('data-edit-key', key).attr('data-edit-date', initDate);

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

        if (name && dest && freq && initialTrain){
            app.instance.close();

            app.edited = key;

            database.ref().child(key).set({
                name,
                dest,
                init,
                freq,
            });

        } 
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
    resetInputs(arr){
        var x;
        for (x of arr){
            $(x).val('');
        }
    },
    minutesFormatted(mins){
        var d = mins / 1440 | 0,
            h = (mins % 1440) / 60 | 0,
            m = mins % 60 | 0;

        if (d !== 0 && h !== 0 && m !== 0){
            return d + 'd ' + h + 'h ' + m + 'm';
        } else if (d !== 0 && h !== 0) {
            return d + 'd ' + h + 'h';
        } else if (h !== 0 && m !== 0){
            return  h + 'h ' + m + 'm';
        } else if (d !== 0){
            return d + 'd';
        } else if (h !== 0){
            return h + 'h';
        } else {
            return m + 'm';
        } 
    },
    getValues(init, freq){
        var diff = moment().diff(moment(init, 'X'), "minutes"),
            remn = diff % freq,
            away = freq - remn;
            awayFormatted = app.minutesFormatted(away),
            next = moment().add(away, "minutes").format('hh:mm a');

        return [next, awayFormatted];
    },
    tableRow(s, key){
        var tr = $('<tr>').addClass('train-info').attr('id', key),
            buttonClose = $('<button>').html('<i class="material-icons">delete</i>').attr('data-key', key).addClass('btn-flat train-delete'),
            buttonEdit =  $('<button>').html('<i class="material-icons">edit</i>').attr('id', key + 'editButton').attr('data-target', 'editTrainModal').attr('data-key', key).attr('data-name', s.name).attr('data-dest', s.dest).attr('data-freq', s.freq).attr('data-init', s.init).addClass('btn-flat train-edit modal-trigger'),
            freq = this.minutesFormatted(s.freq),
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
    tableRowUpdate(snap){
        var obj = snap[app.edited],
            key = app.edited,
            freq = app.minutesFormatted(obj.freq),
            values = app.getValues(obj.init, obj.freq),
            info = [['name', obj.name], ['dest', obj.dest], ['freq', freq], ['next', values[0]], ['away', values[1]]];

        var x;
        for (x of info){
            $('#' + key + x[0]).text(x[1]);
        }

        $('#' + key + 'editButton').attr('data-name', obj.name).attr('data-dest', obj.dest).attr('data-freq', obj.freq).attr('data-init', obj.init);

        app.edited = '';
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
    var elem = document.getElementById('editTrainModal');
    app.instance = M.Modal.init(elem);

    app.init();

    $('#submit').on('click', app.addTrain);
    $('#editTrainSubmit').on('click', app.editTrainSubmit);

    $(document).on('click', '.train-edit', app.editTrain);
    $(document).on('click', '.train-delete', app.deleteTrain);

    database.ref().on("child_added", function(snapshot) {
        var key = snapshot.key;
        app.tableRow(snapshot.val(), key);
      }, function(errorObject) {
        console.log("Errors handled: " + errorObject.code);
    });

    database.ref().on("value", function(snapshot) {
        var snap = snapshot.val();
        if (app.edited !== ''){
            app.tableRowUpdate(snap);
        }  
    });
      

});