/**
	********************
	**   justcal.js   **
	********************

	JavaScript Ultimate Slick Tiny Calendar (datetime picker)
	
		Draggable multilingual keyboard-able calendar - date and time - picker

		It is easy to use, simple yet powerful
		and highly configurable datetime picker 
		with seconds, AM-PM support, multilingual, keyboard-able
		and wide ranged format of input/output date/time.
		
		It requires no extra files - no JavaScript libraries,
		no any css or image files, it works just out of the box
		
		(c) beotiger at beotiger.com | [Andrey Tzar]
		Email: beotiger@gmail.com | Web: http://beotiger.com/justcal
		
		License: MIT License
	
	-----------------------------------------------
	Please notice: this program was inspired by
	the script DateTimePicker_css.js 
	written by TengYong Ng on 16-Nov-2003 23:19
	Website: http://www.rainforestnet.com
	Copyright (c) 2003 TengYong Ng
	Great thanks to TengYong and other contributors
	-----------------------------------------------
**/

/**
	version 1.0b
	Last modified: 2013-11-25 01:04 UTC+04:00 
**/

(function() {
	
	window.justcal = null;	// global variable for calendar object
	var jcWidget;	// widget element

	/** 
		The main function for creating and calling 
		justCal (datetimepicker) widget
	**/
	window.justCal = function(element, options)
	{
		// respect persistent option
		if(jcWidget && jcWidget.style.visibility != "hidden" 
				&& justcal.opts.persistent)
			return false;

		justcal = new JustCal(element, options);
		return true;
	}

/**	***********************
	JustCal prototype
**	**********************/
function JustCal(element, options)
{
	// first of all test the given element
	// if it is invalid, raise error and do nothing

	// element isn't necessary a dom element
	// it may be a jQuery object or an element id
	if (element.jquery){
		// jQuery object was passed
		element = element[0];
	} else if (typeof element == "string") {
		if (/^#.*/.test(element))
			// if jQuery user passes #elementId don't break it					
			element = element.slice(1);                
		element = document.getElementById(element);
	}
	if (!element || element.nodeType !== 1)
		throw new Error("JustCal: please make sure that you're passing a valid element"); 

	this.Control = element; // our element for DateTime value
	
	this.setNow();				// set current day and time

	// Default options
	this.opts = {
		format: '',				// format of date/time 
								// resembles format of PHP function `date()`
								// with some restrictions
								// will be fetched from defaultFormat of current lang
								// if is not set by user options
								
		value: '',				// predefined value for starting date/time
								// which will be used instead of the value 
								// in target element (if it is not an empty string)
		
		showTime: false,		// use time in picker
		time12Mode: false,		// AM/PM availability and 12-hours mode
		showSeconds: false,		// use time with seconds
		
		showExtraPane: true,	// extra panel w. OK/Cancel buttons
		navbar: 'both',		// type of navigation bar: step, select, both or compact
		dateLimit: '',		// may be: future, past or an empty string 
								// (lets us pick dates in the future or in the past only)
		fromDate: '',			// values in format Y-m-d (e.g. 2010-05-23) (YYYY-MM-DD)
		toDate: '',				// which define limit of available dates for picking
								// by default all dates from fromYear to toYear, or dateLimit's
								// are available to be picked
		
		// years could be total numbers or offsets from the current year 
		// (w. `+` sign for toYear and `-` sign for fromYear)
		fromYear: '-12', 		// offset for the first year in a drop down year selection
		toYear: '+7',			// offset for the latest year in a drop down year selection 

		dow: -1,				// first day of the week: 0 - Sun, 1 - Mon ... 6 - Sat
		
		weekChars: 2,			//number of characters for a week day (Su or Sun, Mo or Mon)

		autoTime: true,			// auto turn on showTime, time12Mode and showSeconds
								// according to output format
		onlyTime: false,		// use only time picker

		closeOnESC: true,		// hide widget when ESC key is pressed
		persistent: false,		// if true, prevents hiding widget on clicking outside it
		
		draggable: true,		// allows out widget to be dragged
		leftOffset: 12,			// left offset relative to current pos, can be negative value
		topOffset: -12, 			// top offset relative to current pos, , can be negative value

		lang: 'en',				// localization, see this.lang object above for available langs
		theme: 'jungle'			// theme to use, see this.theme object above for available themes
	};

    // reset new added options
    for (var prop in options)
        this.opts[prop] = options[prop];
	
	this.lang = JustCal.getLang(this.opts.lang);
	this.theme = JustCal.getTheme(this.opts.theme);
	
	// default text for meridiem
	if(!('textAMPM' in this.lang))
		this.lang.textAMPM = ['AM','PM'];

	if(this.opts.autoTime) {
		if(/[gGhHis]/.test(this.opts.format))
			this.opts.showTime = true;	// force showTime
		if(/s/.test(this.opts.format))
			this.opts.showSeconds = true;	// force showSeconds
		if(/[aAgh]/.test(this.opts.format))
			this.opts.time12Mode = true;	// force time12Mode
	}

	// get default format of lang if not specified explicitly
	if(!this.opts.format)
		this.opts.format = this.lang.defaultFormat;
	
	this.opts.dow = +this.opts.dow;
	if(this.opts.dow < 0 || this.opts.dow > 6)
		if('dow' in this.lang)
			this.opts.dow = this.lang.dow;
		else
			this.opts.dow = 1;

	// normalize weekChars
	if(this.opts.weekChars < 1)
		this.opts.weekChars = 1;
	else if(this.opts.weekChars > this.lang.shortWeekdays[0].length)
		this.opts.weekChars = this.lang.shortWeekdays[0].length;

	// normalize start and end years
	if(this.opts.fromYear.toString().charAt(0) == '-')
		this.opts.fromYear = this.Year - Number(this.opts.fromYear.toString().slice(1));
	if(this.opts.toYear.toString().charAt(0) == '+')
		this.opts.toYear = this.Year + Number(this.opts.toYear.toString().slice(1));

	// make sure strings are in proper case
	this.opts.navbar = this.opts.navbar.toLowerCase();
	this.opts.dateLimit = this.opts.dateLimit.toLowerCase();
	
	// type of navigation bar: `step`, `select`, `both` or `compact`
	if(!(this.opts.navbar == 'step' || this.opts.navbar == 'select' || this.opts.navbar == 'compact'))
		this.opts.navbar = 'both';

	// type of dateLimit should be `future`, `past` or an empty string
	if(!(this.opts.dateLimit == 'future' || this.opts.dateLimit == 'past'))
		this.opts.dateLimit = '';

	// allowed months & dates numbers for date limits
	// default: allow all months and dates
	this.fromMonth = 0;	// Jan
	this.toMonth = 11;	// Dec
	
	var dayFrom = 1,
		dayTo = 31;
	
	if(this.opts.dateLimit == 'future') {
		this.opts.fromYear = this.today.getFullYear();
		this.fromMonth = this.today.getMonth();
		dayFrom = this.today.getDate();
	}
	else if(this.opts.dateLimit == 'past') {
		this.opts.toYear = this.today.getFullYear();
		this.toMonth = this.today.getMonth();
		dayTo = this.today.getDate();
	}
	
	// parse fromDate,toDate options
	// they should be in YYYY-MM-DD format for year, month, day
	if(/^\d{4}.\d{2}.\d{2}$/.test(this.opts.fromDate)) {
		this.opts.fromYear = this.opts.fromDate.substring(0,4);
		this.fromMonth = this.opts.fromDate.substring(5,7) - 1;
		dayFrom = this.opts.fromDate.substring(8);
	}
	if(/^\d{4}.\d{2}.\d{2}$/.test(this.opts.toDate)) {
		this.opts.toYear = this.opts.toDate.substring(0,4);
		this.toMonth = this.opts.toDate.substring(5,7) - 1;
		dayTo = this.opts.toDate.substring(8);
	}
	
	// allowed dates to be picked in widget
	this.startDate = new Date(this.opts.fromYear, this.fromMonth, dayFrom).valueOf();
	this.finalDate = new Date(this.opts.toYear, this.toMonth, dayTo).valueOf();
	
	// existing date and time
    if (this.Control.nodeName.toUpperCase() == 'INPUT' ||
	  this.Control.nodeName.toUpperCase() == 'TEXTAREA')
		this.exDateTime = this.Control.value; // value of textbox or textarea elements
	else
		this.exDateTime = this.Control.innerHTML;
		// or this.Control.textContent || this.Control.innerText; ??
		
	if(this.opts.value)
		this.exDateTime = this.opts.value;	// redefine fetched value
		
	if (this.exDateTime)
	// try to parse it and set date/time respectively
		this.formatDateIn(this.exDateTime);

	// define and normalize selected date
	this.selDate = new Date(this.Year, this.Month, this.Date);

	if(this.selDate.valueOf() < this.startDate)
		this.selDate = new Date(this.startDate);
	if(this.selDate.valueOf() > this.finalDate)
		this.selDate = new Date(this.finalDate);

	// create and render new picker
	this.renderPicker(true);
}

JustCal.prototype = {

// set current date and time
setNow: function() {
	this.today = new Date();
	
	this.Date = this.today.getDate();
	this.Month = this.today.getMonth();
	this.Year = this.today.getFullYear();
	
	this.Hours = this.today.getHours();
	if (this.Hours < 10)
		this.Hours = "0" + this.Hours;
		
	this.Minutes = this.today.getMinutes();
	if (this.Minutes < 10)
		this.Minutes = "0" + this.Minutes;
		
	this.Seconds = this.today.getSeconds();
	if (this.Seconds < 10)
		this.Seconds = "0" + this.Seconds;

	if (this.Hours < 12)
		this.AMorPM = 0;
	else
		this.AMorPM = 1;
},

incYear: function ()
{
    if (this.Year < this.opts.toYear)
	    this.Year++;
	this.renderPicker();
},

decYear: function ()
{
    if (this.Year > this.opts.fromYear)
	    this.Year--;
	this.renderPicker();
},

incMonth: function()
{
	if(this.Year == this.opts.toYear
			&& this.Month >= this.toMonth)
		return;

	this.Month++;

	if (this.Month >= 12) {
		this.Month = 0;
		this.incYear();
	}
	else
		this.renderPicker();
},

decMonth: function()
{
		if(this.Year == this.opts.fromYear 
				&& this.Month <= this.fromMonth)
			return;

        this.Month--;
        if (this.Month < 0) {
            this.Month = 11;
            this.decYear();
        }
		else
			this.renderPicker();
},

switchMonth: function (intMth)
{
	this.Month = Number(intMth);
	this.renderPicker();
},

switchYear: function (intYear)
{
	this.Year = Number(intYear);
	this.renderPicker();
},

setHours: function(intHour)
{
    var MaxHour = 23,
		MinHour = 0;

	if (this.opts.time12Mode) {
        MaxHour = 12;
        MinHour = 1;
    }

    intHour = Number(intHour);
	// if intHour is Not a Number then set it to zero value
	if(isNaN(intHour))
		intHour = 0;
		
    if (intHour > MaxHour)
        intHour = MaxHour;
    if (intHour < MinHour)
        intHour = MinHour;

	if ((this.opts.time12Mode) && (this.AMorPM == 1) && (intHour < 12))
		intHour += 12;
	else if ((this.opts.time12Mode) && (this.AMorPM == 0) && (intHour == 12))
	// 12AM = 00:00?
		intHour = 0;

	// add leading zero sign
	if(intHour < 10)
		intHour = '0' + intHour;
	
	this.Hours = intHour;
},

setMinutes: function (intMin)
{
	var MaxMin = 59,
		MinMin = 0;
		
    intMin = Number(intMin);
	// if intMin is Not a Number then set it to zero value
	if(isNaN(intMin))
		intMin = 0;

	if (intMin > MaxMin)
		intMin = MaxMin;
	else if (intMin < MinMin)
		intMin = MinMin;

	if (intMin < 10)
		intMin = '0' + intMin;

	this.Minutes = intMin;
},

setSeconds: function (intSec)
{
	var MaxSec = 59,
		MinSec = 0;

    intSec = Number(intSec);
	// if intSec is Not a Number then set it to zero value
	if(isNaN(intSec))
		intSec = 0;

	if (intSec > MaxSec)
		intSec = MaxSec;
	else if (intSec < MinSec)
		intSec = MinSec;

	if (intSec < 10)
		intSec = '0' + intSec;

	this.Seconds = intSec;
},

getShowHour: function(modeAMPM)
{
    var finalHour;
	
	if(modeAMPM === undefined)
		modeAMPM = this.opts.time12Mode;

	// modeAMPM true for 12-mode hours
    if (modeAMPM) {
		finalHour = Number(this.Hours);
		
        if (finalHour == 0) {
            this.AMorPM = 0;
            finalHour = 12;
        }
        else if (finalHour == 12)
            this.AMorPM = 1;
        else if (finalHour > 12) {
            this.AMorPM = 1;
            finalHour -= 12;
			if(finalHour < 10)
                finalHour = '0' + finalHour;
        }
        else {
            this.AMorPM = 0;
            if (finalHour < 10)
                finalHour = '0' + finalHour;
		}
	}
    else
		finalHour = this.Hours;

    return finalHour;
},

setAmPm: function (value)
{
	this.AMorPM = value & 1;
	this.Hours = Number(this.Hours);
	
	if (value == "1") {	// PM
		if(this.Hours < 12)
			this.Hours += 12;
	}
	else if(this.Hours >= 12) // for AM
		this.Hours -= 12;
	
	if(this.Hours < 10)
		this.Hours = '0' + this.Hours;
},

// parse AM/PM string for current lang
// and set AM or PM accordingly
findAndSetAmPm: function(val)
{
	var l = this.lang.textAMPM[0].length;
	
	if(this.lang.textAMPM[0].toUpperCase() === val.substring(0,l)) {
	// this is AM
		this.setAmPm(0);
		return l;
	}
	
	// let us do not validate PM string
	this.setAmPm(1);
	return this.lang.textAMPM[1].length;
},

// get the name of the month
getMonthName: function (isLong, theMonth)
{
	var myMonth;
	if(theMonth !== undefined)
		myMonth = theMonth;
	else
		myMonth = this.Month;
		
	myMonth = Number(myMonth);
	myMonth = this.lang.monthNames[myMonth];

	if (isLong)
		return myMonth;
	return myMonth.substr(0, 3);
},

// get number of days in a month
getDaysInMonth: function(year,month)
{
	if(year === undefined)
		year = this.Year;
	if(month === undefined)
		month = this.Month;

    var daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

	// for leap year there are 29 days in Februaury
    if (this.isLeapYear(year))
        daysInMonth[1] = 29;

    return daysInMonth[month];
},

isLeapYear: function (year)
{
	if(year === undefined)
		year = this.Year;
		
	if ((year % 4) == 0) {
		if ((year % 100 == 0) && (year % 400) != 0)
			return false;
		else
			return true;
	}
	return false;
},

getMonthIndex: function (shortMonthName)
{
	shortMonthName = shortMonthName.toUpperCase();
	
	for (var i = 0; i < 12; i++)
		if (this.lang.monthNames[i].substring(0, 3)
				.toUpperCase()	== shortMonthName)
			return i;
	return 0;	// may be `return -1` should be better
},

/**
	Search for month name in val
	and return its length and index
**/
getFullMonthIndex: function (val)
{
	val = val.toUpperCase();

	for (var i = 0; i < 12; i++)
		if (val.search(this.lang.monthNames[i].toUpperCase()) != -1)
			return { len: this.lang.monthNames[i].length, idx: i };
	return { len: 1, idx: 0};
},

formatDateOut: function (pDate,pMonth,pYear)
{
	var theMonth,
		MonthDigit,
		YearDigit = pYear || this.Year,
		week,
		tokens;

	// we can't use || because pMounth can be equal to 0
	if(pMonth !== undefined)
		 MonthDigit = pMonth;
	else
		MonthDigit = this.Month;
		
	pDate = Number(pDate);	// avoid prefixing extra '0' for values like '09'

	if (pDate < 10)
		pDate = "0" + pDate;
		
	theMonth = Number(MonthDigit);	// js number of month 0..11 for getMonthName calls
	// from JavaScript 0..11 to usual 1..12
	// also converts MonthDigit to Number
	MonthDigit++;
	if (MonthDigit < 10)
		MonthDigit = '0' + MonthDigit;

	// get the # of a weekday 0..6 (0 - Sunday, 1 - Monday, 2 - Tuesday etc.)
	week = new Date(YearDigit, theMonth, pDate).getDay();
	tokens = {
		// hours in two formats: 0..23 and 1..12
		'g': Number(this.getShowHour(true)),	// 1..12
		'G': Number(this.Hours),				// 0..23
		'h': this.getShowHour(true),			// 01..12
		'H': this.Hours,						// 00..23
		
		// minutes and seconds in two digits
		'i': this.Minutes,
		's': this.Seconds,

		// day of the week
		'w': week,								// # of a weekday 0..6
		
		// day
		'd': pDate,				// day of the month 01..31 (always two digits)
		'j': Number(pDate),	// day of the month 1..31 (one or two digits)
		
		// month
		'n': Number(MonthDigit),	// # of a month 1..12
		'm': MonthDigit,			// # of a month 01..12
		
		// year
		'Y': YearDigit,							// 4 digits: 2013, 1999 etc.
		'y': YearDigit.toString().substr(2,2),	// 2 digits: 13, 99 etc.

		// AM/PM
		'a': this.lang.textAMPM[this.AMorPM].toLowerCase(),// AM|PM lowercased
		'A': this.lang.textAMPM[this.AMorPM].toUpperCase(),// AM|PM uppercased

		// name of a month
		'F': this.getMonthName(true, theMonth),		// January, February, March etc.
		'M': this.getMonthName(false, theMonth),		// Jan, Feb, Mar etc.
		
		// day of the week
		'D': this.lang.weekdays[week].substr(0,3),	// 3 chars of a day of the week (Sun,Mon,Tue etc.)
		'l': this.lang.weekdays[week]				// full name of a weekday (Sunday,Monday, etc.)
	};

/*
	replace all known tokens in format string
	with their actual values, leaving other chars untouched
	
	We can not use simple replacing of tokens,
	for when it comes to replacing names of months and weeks
	it will spawn unwanted tokens, 
	(e.g. December spawns `D` token in a string) 
	which will be parsed later in example like this:

	var output = this.opts.format;
	for(var prop in tokens)
		output = output.replace(new RegExp(prop,'g'), tokens[prop]);
*/
	var ch,				// format char
		output = '';	// output string
	
	for(var i = 0, j = this.opts.format.length; i < j; i++) {
		ch = this.opts.format.charAt(i);
		if(ch in tokens)
			output += tokens[ch];
		else
			output += ch;	// unknown token just add to output
	}
	
//	console.log('formatDateOut out: ' + output);

	return output;
},

/**
	Try to analyze input value 
	and set current date/time respectively
**/
formatDateIn: function (val)
{
	var myFormat = this.opts.format,
		i = 0,	// current position in val string
		l,		// number of chars to skip from myFormat string
		ch,		// char in myFormat string
		ch1,ch2,		// current chars in val
		digit,
		mObj,			// for getting month index and string length
		day,month,year;
		
	while(myFormat.length > 0 && val.length > 0) {
//		console.log('myFormat = ' + myFormat + '\nval = ' + val);

		l = 1;
		ch1 = val.charAt(0);
		digit = false;
		if(val.length > 1) {
			ch2 = val.charAt(1);
			digit = /\d/.test(ch2);		// true if second char is a digit
		}
		ch = myFormat.charAt(0);
		switch(ch) {
			case 'a':
			case 'A': 	// AM|PM lowercased or uppercased
							l = this.findAndSetAmPm(val.toUpperCase());	
							break;
			
			// hours in two formats: 0..23 and 1..12
			case 'g':
			case 'G': 
					if(digit) { ch1 += ch2; l++; }
					this.setHours(ch1);	// 1..12
					break;
			case 'h':
			case 'H': 
					this.setHours(ch1+ch2);			// 01..12,00..23
					l++;
					break;
					
			// minutes and seconds in two digits
			case 'i':
					this.setMinutes(ch1+ch2);
					l++;
					break;
			case 's':
					this.setSeconds(ch1+ch2);
					l++;
					break;

			// day of the week
			case 'D': l = 3; break; 	// just skip 3 chars of a day of the week (Sun,Mon,Tue etc.)
			// find the full name of a weekday and skip its length
			case 'l': l = this.findWeek(val); break;
			case 'w': break;			// skip the # of a weekday 0..6
			
			// day
			case 'd': 
				day = ch1 + ch2;
				l++;
				break;// day of the month 01..31 (always two digits)
			case 'j': 
				if(digit) { ch1+=ch2; l++};	// day of the month 1..31 (one or two digits)
				day = ch1;
				break;
				
			// month
			case 'n':
				if(digit) { ch1+=ch2; l++};	// # of the month 1..31 (one or two digits)
				month = ch1;
				break;

			case 'm': 	
				month = ch1 + ch2; // # of a month 01..12
				l++;
				break;
				
			// year
			case 'Y': year = val.substr(0,4); l = 4; break;	// 4 digits: 2013, 1999 etc.
			case 'y': year = ch1 + ch2; l++; break;				// 2 digits: 13, 99 etc.

			// name of a month
			case 'F': // January, February, March etc.
				mObj = this.getFullMonthIndex(val); // index of a month
				l = mObj.len;	// length
				month = mObj.idx + 1;	// index
				break;
			case 'M': // Jan, Feb, Mar etc.
				month = this.getMonthIndex(val.substr(0,3)) + 1; // index of a month
				l = 3;
				break;
		
			default:
				break;	// just skip unknown token
		}
		val = val.slice(l);		// not 1, but l (like L in lowercase)
		myFormat = myFormat.slice(1);	// 1, not l
	}
	
	// test date for correctness
	year = Number(year);
	if(year < 10)
		year = Number('200'+year);
	else if(year < 50)
		year = Number('20'+year);
	else if(year < 100)
		year = Number('19'+year);

	if(year.toString().length == 4 
			&& year >= this.opts.fromYear 
			&& year <= this.opts.toYear)
		this.Year = year;
		
	month--;
	if (month >= 0 && month < 12)
		this.Month = month;

	// day depends on current month and year
	day = Number(day);
	if (day >= 1 && day <= this.getDaysInMonth())
		this.Date = day;
},

/**
	Find name of a dayweek in val
	and return its length
	or 1 if nothing has been found
**/
findWeek: function (val)
{
	val = val.toUpperCase();
	
	for(var i = 0; i < 7; i++)
		if(val.search(this.lang.weekdays[i].toUpperCase()) != -1)
			return this.lang.weekdays[i].length;
	return 1;	// 1 char to skip
},

selectDate: function (date)
{
    this.Date = date;
    this.selDate = new Date(this.Year, this.Month, date);
    this.renderPicker();
},

// sets datetime for the element
setDateTime: function (pDate,pMonth,pYear)
{
	var val = this.formatDateOut(pDate,pMonth,pYear);

    if (this.Control.nodeName.toUpperCase() == 'INPUT' ||
	  this.Control.nodeName.toUpperCase() == 'TEXTAREA') {
		this.Control.value = val; // value of a textbox or textarea elements
		// don't forget to fire an `onchange` handler 
		// 			if it exists and the field has been changed
		if(typeof this.Control.onchange == 'function' && this.exDateTime !== val)
			this.Control.onchange();
	}
	else
		this.Control.innerHTML = val; // inner text for other elements
/*
	We are not using
		this.Control.innerText = val;
		this.Control.textContent = val;
	due to possible HTML layout in format option
*/
	this.Control.focus();	// focus target element
	this.hide();			// hide picker
},

// hide widget
hide: function() {
	jcWidget.style.visibility = 'hidden';
},

// change background color of hover element
highlight: function(element, col, oldBgColor)
{
	if (!col) {
		element.style.background = this.theme.hoverColor;
		element.style.cursor = "pointer";
	}
	else {
		if (oldBgColor)
			element.style.background = oldBgColor;
		else
			element.style.background = this.theme.mainBgColor;
		element.style.cursor = "inherit";
	}
},

// generate table cell with some value
genCell: function (value, color, clickable)
{
	var cell;

	value = value || '';
	color = color || this.theme.mainBgColor;
	
	if(clickable === undefined)
		clickable = true;

	if (value) {
		if (clickable) {
		    if (this.opts.showExtraPane) {
				cell = "<td style='cursor:pointer;background-color:" + color + ";padding:0;margin:0' onmouseover='justcal.highlight(this, 0)' onmouseout=\"justcal.highlight(this, 1,'" + color + "')\" onmousedown='justcal.selectDate(" + value + ")'>" + value + "</td>"; }
		    else {
				cell = "<td style='cursor:pointer;background-color:" + color + ";padding:0;margin:0' onmouseover='justcal.highlight(this, 0)' onmouseout=\"justcal.highlight(this, 1,'" + color + "')\" onclick=\"justcal.setDateTime('" + value + "')\">" + value + "</td>"; }
		}
		else
			cell = "<td style='background-color:" + color + ";padding:0;margin:0'>"+value+"</td>";
	}
	else
		cell = "<td style='background-color:" + color + ";padding:0;margin:0'>&nbsp;</td>";

	return cell;
},

// render new HTML for widget with current year and month
// create jcWidget only first time when called
renderPicker: function(refresh)
{
	var html,
		curDate,
		today,
		i,
		vDayCount = 0,
		vFirstDay,
		cell,
		selectAm,
		selectPm;

	html = "<table style='width:100%;padding:0;margin:5px auto 5px auto;font-size:12px;text-align:center;cursor:auto'><tbody>";

	html += "<tr><td style='padding:0;margin:0'>\n\n";

	if ((this.opts.navbar == "select" || this.opts.navbar == "both") && !this.opts.onlyTime) {
	    html += "<table style='border:none;width:100%'><tr><td style='padding:0;margin:0;text-align:center'><select onchange='justcal.switchMonth(this.selectedIndex);'>";
		for (i = 0; i < 12; i++) {
			if (i == this.Month)
				selectAm = 'selected';
			else
				selectAm = '';
			html += "<option " + selectAm + " value=" + i + ">" + this.lang.monthNames[i] + "</option>";
		}

		html += "</select></td>";

		html += "<td style='padding:0;margin:0;text-align:center'><select onchange='justcal.switchYear(this.value)'>";
		for (i = this.opts.fromYear; i <= this.opts.toYear; i++) {
			if (i == this.Year)
				selectAm = 'selected';
			else
				selectAm = '';
			html += "<option " + selectAm + " value=" + i + ">" + i + "</option>\n";
		}
		html += "</select></td></tr></table>\n";
	}

	if ((this.opts.navbar == "step" || this.opts.navbar == "both") && !this.opts.onlyTime)
	{
		html += "<table style='border:none;width:100%'><tr><td style='padding:0;margin:0'><span title='" + this.lang.textPrevYear + "' onmousedown='justcal.decYear()' onmouseover='justcal.highlight(this,0)' onmouseout='justcal.highlight(this,1)' style='font-size:14px;color:" + this.theme.cycleColor + "'>&lt;&lt;</span></td>";// decrease 1 year
		
		html += "<td style='padding:0;margin:0'><span title='" + this.lang.textPrevMonth + "' onmousedown='justcal.decMonth()' onmouseover='justcal.highlight(this,0)' onmouseout='justcal.highlight(this,1)' style='font-size:14px;color:" + this.theme.cycleColor + "'>&nbsp;&nbsp;&lt;&nbsp;</span></td>\n";// decrease 1 month
		
		html += "<td style='width:70%;font-family:Verdana;font-weight:bold;color:" + this.theme.cycleColor + ";padding:0;margin:0'>" + this.getMonthName(true) + " " + this.Year + "</td>\n"; // month and year
		
		html += "<td style='padding:0;margin:0'><span title='" + this.lang.textNextMonth + "' onmousedown='justcal.incMonth()' onmouseover='justcal.highlight(this,0)' onmouseout='justcal.highlight(this,1)' style='font-size:14px;color:" + this.theme.cycleColor + "'>&nbsp;&gt;&nbsp;&nbsp;</span></td>\n";// increase 1 month
		
		html += "<td style='padding:0;margin:0'><span title='" + this.lang.textNextYear + "' onmousedown='justcal.incYear()'  onmouseover='justcal.highlight(this,0)' onmouseout='justcal.highlight(this,1)' style='font-size:14px;color:" + this.theme.cycleColor + "'>&gt;&gt;</span></td></tr></table>\n";// increase 1 year
	}

	if (this.opts.navbar == "compact" && !this.opts.onlyTime) {
	    html += "<table style='border:none;width:100%'><tr>";
		
		html += "<td style='padding:0;margin:0'><span title='" + this.lang.textPrevMonth + "' onmousedown='justcal.decMonth()' onmouseover='justcal.highlight(this,0)' onmouseout='justcal.highlight(this,1)' style='font-size:14px;color:" + this.theme.cycleColor + "'>&nbsp;&nbsp;&lt;&nbsp;</span></td>\n";// decrease 1 month
		
		html += "<td style='width:70%;font-family:Verdana;font-weight:bold;color:" + this.theme.cycleColor + ";padding:0;margin:0'>" + this.getMonthName(true) + "</td>\n"; // month and year
		
		html += "<td style='padding:0;margin:0'><span title='" + this.lang.textNextMonth + "' onmousedown='justcal.incMonth()' onmouseover='justcal.highlight(this,0)' onmouseout='justcal.highlight(this,1)' style='font-size:14px;color:" + this.theme.cycleColor + "'>&nbsp;&gt;&nbsp;&nbsp;</span></td>\n";// increase 1 month

		html += "<td style='padding:0;margin:0;text-align:center'><select onchange='justcal.switchYear(this.value)'>";
		for (i = this.opts.fromYear; i <= this.opts.toYear; i++) {
			if (i == this.Year)
				selectAm = 'selected';
			else
				selectAm = '';
			html += "<option " + selectAm + " value=" + i + ">" + i + "</option>\n";
		}
		html += "</select></td></tr></table>\n";
	}

	html += "\n\n</td></tr>\n";

	if(!this.opts.onlyTime)
	{
		// weekday header
		html += "<tr><td style='padding:0;margin:0'><table style='font-family:Verdana;border-spacing:1px;border-collapse:separate'><tr>";

		var dow,
			dowsun = [6,0,1,2,3,4,5];	// for Sunday definition
		
		// swap Sunday and Monday
		dow = this.opts.dow;
		while (dow--)
			this.lang.shortWeekdays
				.push(this.lang.shortWeekdays.shift());

		for (i = 0; i < 7; i++)
			html += "<td style='background-color:" + this.theme.weekHeaderColor + ";width:30px;color:" + this.theme.weekFontColor + ";padding:2px 0;margin:0'>" + this.lang.shortWeekdays[i].substr(0, this.opts.weekChars) + "</td>";

		// swap back Sunday and Monday
		dow = this.opts.dow;
		while (dow--)
			this.lang.shortWeekdays
				.unshift(this.lang.shortWeekdays.pop());

		html += "</tr>\n";

		curDate = new Date(this.Year, this.Month, 1);
		vFirstDay = curDate.getDay();

		// let us do some more arithmetic
		dow = this.opts.dow;
		if (dow)
			while (dow--)
				if (--vFirstDay < 0)
				vFirstDay = 6;

		html += "<tr>";

		for (i = 0; i < vFirstDay; i++)	{
			html += this.genCell();
			vDayCount++;
		}
		
		// today value without time
		today = new Date(this.today.getFullYear(), this.today.getMonth(), 
											this.today.getDate()).valueOf();
		dow = this.opts.dow;	// first day of the week

		for (i = 1; i <= this.getDaysInMonth(); i++)
		{
			// value of the rendering day (without time)
			curDate = new Date(this.Year, this.Month, i).valueOf();

			if ((vDayCount % 7 == 0) && (i > 1))
				html += "<tr>";

			vDayCount = vDayCount + 1;

			if (curDate == this.selDate.valueOf())
				// selected date
				cell = this.genCell(i, this.theme.selectedColor);
			else if (curDate < this.startDate || curDate > this.finalDate)
				// date out of specified range is not clickable
				cell = this.genCell(i, this.theme.disabledColor, false);
			else if (curDate == today)
				// today is always shown
				cell = this.genCell(i, this.theme.todayColor);
			else {
				// determine bgcolor for Sunday,Saturday and other day
				if ((vDayCount + dow) % 7 == 0)
					cell = this.genCell(i, this.theme.SaturdayColor);
				else if ((vDayCount + dowsun[dow]) % 7 == 0)
					cell = this.genCell(i, this.theme.SundayColor);
				else
					cell = this.genCell(i, this.theme.weekDayColor);
			}

			html += cell;

			if ((vDayCount % 7 == 0) && (i < this.getDaysInMonth()))
				html += "</tr>\n";
		}

		// finish the table proper
		while (vDayCount++ % 7 != 0)
				html += this.genCell();

		html += "</table></td></tr>\n";
	}
	
	// time picker
	if (this.opts.showTime || this.opts.onlyTime)
	{
		html += "<tr><td style='text-align:center;padding:0;margin:0'><table style='border:none;width:100%'><tbody><tr><td style='text-align:center;padding:0;margin:0'>";

		html += "<input style='text-align:center;width:22px' onclick='this.select()' type='text' maxlength='2'  value='" + this.getShowHour() + "' onkeyup='justcal.setHours(this.value)'>&nbsp;:&nbsp;";
		html += "<input style='text-align:center;width:22px' onclick='this.select()' type='text' maxlength='2' value='" + this.Minutes + "' onkeyup='justcal.setMinutes(this.value)'>";

		if (this.opts.showSeconds) {
		    html += "&nbsp;:&nbsp;";
			html += "<input style='text-align:center;width:22px' onclick='this.select()' type='text' maxlength='2' size='2' value='" + this.Seconds + "' onkeyup='justcal.setSeconds(this.value)'>";
		}

		if (this.opts.time12Mode) {
			selectAm = (this.AMorPM == 0) ? "selected" : "";
			selectPm = (this.AMorPM == 1) ? "selected" : "";

			html += "&nbsp;";
			html += "<select onchange='justcal.setAmPm(this.options[this.selectedIndex].value)'>\n";
			html += "<option " + selectAm + " value='0'>"+ this.lang.textAMPM[0] +"</option>";
			html += "<option " + selectPm + " value='1'>"+ this.lang.textAMPM[1] +"</option>";
			html += "</select>";
		}

		html += "</td></tr>\n";
	}
	
	if(this.opts.showExtraPane || this.opts.onlyTime) {
	// add panel with OK/Cancel buttons
		html += "<tr><td style='text-align:center;padding:5px 0 0;margin:0'><input style='width:40%' onclick='justcal.setDateTime(\"" + this.selDate.getDate() + "\", \"" + this.selDate.getMonth() + "\", \"" + this.selDate.getFullYear() + "\")'  type='button' value='" + this.lang.textOK + "'>&nbsp;&nbsp;<input style='width:40%' onclick='justcal.hide()' type='button' value='" + this.lang.textCancel + "'></td></tr>\n";
	}

	html += "</tbody></table></td></tr>\n";
	html += "</tbody></table>\n";

	this.dragPos = null;	// use for dragging picker widget

	if(refresh) {
		if (!jcWidget) {
		// first time creating the widget
		// create new widget and attach some events to it and the document
			jcWidget = document.createElement("div");
			
			jcWidget.style.position = "absolute";
			jcWidget.style.maxWidth = "208px";
			jcWidget.style.minWidth = "208px";
			jcWidget.style.padding = "0";
			document.body.appendChild(jcWidget);
			
			// on double click go to the current date and time
			DOM_helper.attach(jcWidget,'dblclick',function(event)
				{
					event = event || window.event;
					var target = event.target || event.srcElement;

					// prevent false dblclicking on step navbar (in IE?)
					if(!target.title) {
						justcal.setNow();
						justcal.renderPicker();
					}
				});
			
			DOM_helper.attach(jcWidget,'mousedown',function(event) 
				{
					if(!event) event = window.event;
					
					var scroll = DOM_helper.getScrollOffsets();

					justcal.widgetOffLeft = event.clientX + scroll.x - jcWidget.offsetLeft;
					justcal.widgetOffTop = event.clientY + scroll.y - jcWidget.offsetTop;

					justcal.dragPos = jcWidget.style; // for moving widget

					// prevent bubbling to stop closing the widget
					if(event.stopPropagation)
						event.stopPropagation();
					else
						event.cancelBubble = true;
					
					// for IE<9 there is no event.target, but event.srcElement
					// disable text selection while dragging
					var target = event.target || event.srcElement;
					var el = target.nodeName.toUpperCase();
					if(!(el == 'SELECT' || el == 'INPUT'))
						DOM_helper.preventDefault(event);
					else
					// disable dragging for input and select elements
						justcal.dragPos = null;

					return false;
				});
				
			DOM_helper.attach(document,'mousedown',function (event)
				{
					// hide widget
					if(!justcal.opts.persistent)
						justcal.hide();
				});
					
			DOM_helper.attach(document,'mouseup',function()
				{ justcal.dragPos = null; });

			DOM_helper.attach(document,'mousemove',function (event)
				{
					if(!event) event = window.event;
					
					// do real dragging of our calendar widget
					if (justcal.opts.draggable && justcal.dragPos) {
						var scroll = DOM_helper.getScrollOffsets();
						
						justcal.dragPos.left = (event.clientX + scroll.x - justcal.widgetOffLeft) + 'px';
						justcal.dragPos.top = (event.clientY + scroll.y - justcal.widgetOffTop) + 'px';
					}
				});

			// closing the widget on `ESC` press
			DOM_helper.attach(document,'keyup', function(e){
				e = e || window.event;
				if(e.keyCode == 27 && justcal.opts.closeOnESC)
					// hide widget
					justcal.hide();
			});
			
			DOM_helper.attach(document,'keydown', function(e){
				e = e || window.event;
				
				// apply selected date on Enter key press
				if(jcWidget.style.visibility == 'visible' 
						&& e.keyCode == 13)
					justcal.setDateTime(justcal.selDate.getDate(), 
						justcal.selDate.getMonth(), justcal.selDate.getFullYear());
				var target = e.target || e.srcElement,
					el = target.nodeName.toUpperCase();
				
				// move selected date according to pressed arrow key					
				if(jcWidget.style.visibility == 'visible' 
						&& e.keyCode >= 37 && e.keyCode <= 40 
						&& el != 'SELECT') {

					DOM_helper.preventDefault(e);

					var d;
				
					switch(e.keyCode) {
						case 37: d = -1;break;	// left
						case 38: d = -7;break;	// up
						case 39: d = 1;break;	// right
						case 40: d = 7;break;	// down
					}
					justcal.selDate.setDate(justcal.selDate.getDate() + d);
					
					// revert if we are off date limits
					if(justcal.selDate.valueOf() < justcal.startDate 
							|| justcal.selDate.valueOf() > justcal.finalDate)
						justcal.selDate.setDate(justcal.selDate.getDate() - d);

					justcal.Year = justcal.selDate.getFullYear();
					justcal.Month = justcal.selDate.getMonth();
					justcal.selectDate(justcal.selDate.getDate());
					return false;
				}
				return true;
			});
		}
		
		// fill in the contents of the widget
		// do it here to determine width and height below
		jcWidget.innerHTML = html;
		
		// change cursor if we are allowed to drag it
		if(this.opts.draggable)
			jcWidget.style.cursor = "move";
		else
			jcWidget.style.cursor = "auto";
		
		// change border and background colors of the widget according to current theme
		jcWidget.style.border = this.theme.mainBorder;
		jcWidget.style.backgroundColor = this.theme.mainBgColor;		

		// calculate new position for our widget
		// according to position of target element
		var pos = DOM_helper.findPos(this.Control),	// position of target element
			scroll = DOM_helper.getScrollOffsets(),	// scroll positions
			view = DOM_helper.getViewportSize(),	// size of viewport
			xpos, ypos;

		var leftOffset = parseInt(this.opts.leftOffset) || 0,
			topOffset = parseInt(this.opts.topOffset) || 0;
		
		xpos = pos.x + leftOffset;
		ypos = pos.y + topOffset;

		// logical coords of right,bottom of viewport
		var winright = scroll.x + view.w,
			winbottom = scroll.y + view.h;

		// let's be sure that the widget fits the viewport
		if(xpos + jcWidget.offsetWidth  > winright)
			xpos = winright - jcWidget.offsetWidth;
		if(ypos + jcWidget.offsetHeight  > winbottom)
			ypos = winbottom - jcWidget.offsetHeight;

		if(xpos < scroll.x)
			xpos = scroll.x;
		if(ypos < scroll.y)
			ypos = scroll.y;
		
		jcWidget.style.left = xpos + 'px';
		jcWidget.style.top = ypos + 'px';
		
		jcWidget.style.visibility = "visible";
	}
	else
		jcWidget.innerHTML = html;
		
	return true;
}

};
/**	***********************************
	end of JustCal prototype
**	**********************************/

/**
	JustCal static methods
**/

JustCal.getLang = function(lang)
{
	/**
		Localizations: 
		en,ru,fr,de,zh,ja,ko,es,pt,it,fi,sv,uk,pl,ar,cs,ka,he,hi,th,tr,nl,id,bn,sr,hy,fa
		(in no particular order)

		Written with help of Moment.js (http://momentjs.com),
		Google translator (http://translate.google.com)
		and DateTime-Locale-0.45 on CPAN (http://search.cpan.org/~drolsky/DateTime-Locale-0.45)
	
		If you find any error in these translations please report to beotiger@gmail.com
		
		Note: localization includes `dow' - first day of the week,
				and `textAMPM` for AM/PM in 12-hour mode.
				
			If dow is not set in lang, it defaults to 1 (Monday)
			If textAMPM is not set in lang, it defaults to ['AM','PM']
	**/
	var langs = {
		'en': {	/* english - default */
			monthNames: ["January", "February", "March", "April", "May", "June", 
							"July", "August", "September", "October", "November", "December"],
			weekdays: ["Sunday", "Monday", "Tuesday", "Wednesday",
								"Thursday", "Friday", "Saturday"],
			shortWeekdays: ["Sun", "Mon", "Tue", "Wed",	"Thu", "Fri", "Sat"],

			textOK: 'OK',
			textCancel: 'Cancel',
			textPrevYear: 'previous year',
			textNextYear: 'next year',
			textPrevMonth: 'previous month',
			textNextMonth: 'next month',
			defaultFormat: 'm/d/Y',
			dow: 0	// first day of the week: 0 - Sun, 1 - Mon ... 6 - Sat
		},
		'ru': {	/* russian */
			monthNames: ["Январь","Февраль","Март","Апрель","Май","Июнь","Июль","Август","Сентябрь","Октябрь","Ноябрь","Декабрь"],
			weekdays: ["Воскресенье","Понедельник","Вторник","Среда",
								"Четверг","Пятница","Суббота"],
			shortWeekdays: ["Вск","Пнд","Втр","Срд","Чтв","Птн","Сбт"],
			textOK: 'OK',
			textCancel: 'Отмена',
			textPrevYear: 'год назад',
			textNextYear: 'год вперёд',
			textPrevMonth: 'предыдущий месяц',
			textNextMonth: 'следующий месяц',
			defaultFormat: 'd.m.Y',
			textAMPM: ['дп','пп']
		},
		'fr': { /* french */
			monthNames: ["Janvier","Février","Mars","Avril","Mai","Juin",
							"Juillet","Août","Septembre","Octobre","Novembre","Décembre"],
			weekdays: ["dimanche","lundi","mardi","mercredi","jeudi","vendredi","samedi"],
			shortWeekdays: ["Di","Lu","Ma","Me","Je","Ve","Sa"],
			textOK: 'OK',
			textCancel: 'résilier',
			textPrevYear: 'année précédente',
			textNextYear: 'année prochaine',
			textPrevMonth: 'mois précédent',
			textNextMonth: 'mois prochain',
			defaultFormat: 'd/m/Y'
		},
		'de': { /* german */
			monthNames: ["Januar","Februar","Marz","April","Mai","Juni","Juli",
							"August","September","Oktober","November","Dezember"],
			weekdays: ["Sonntag","Montag","Dienstag","Mittwoch",
							"Donnerstag","Freitag","Samstag"],
			shortWeekdays: ["So","Mo","Di","Mi","Do","Fr","Sa"],

			textOK: 'OK',
			textCancel: 'Stornieren',
			textPrevYear: 'Vorjahr',
			textNextYear: 'nächsten Jahr',
			textPrevMonth: 'Vormonat',
			textNextMonth: 'nächsten Monat',
			defaultFormat: 'd.m.Y',
			textAMPM: ['vorm.','nachm.']
		},
		'zh': {	/* chinese simplified
					note:  monthNames should be no less than 3 chars in length
					for correct parsing of input date	*/
			monthNames: ["一月 ","二月 ","三月 ","四月 ","五月 ","六月 ","七月 ",
							"八月 ","九月 ","十月 ","十一月","十二月"],
			weekdays: ["星期日","星期一","星期二","星期三","星期四","星期五","星期六"],
			shortWeekdays: ["日","一","二","三","四","五","六"],

			textOK: '行',
			textCancel: '取消',
			textPrevYear: '上年',
			textNextYear: '明年',
			textPrevMonth: '前一个月',
			textNextMonth: '下个月',
			defaultFormat: 'Y年Mj日',
			dow: 0,
			textAMPM: ['上午','下午']
		},
		'ja': {	/* japanese (ja) */
			// note: spaces after months names need for correct parsing of input string
			monthNames: ["1月 ","2月 ","3月 ","4月 ","5月 ","6月 ","7月 ","8月 ","9月 ","10月","11月","12月"],
			weekdays: ["日曜日","月曜日","火曜日","水曜日","木曜日","金曜日","土曜日"],
			shortWeekdays: ["日","月","火","水","木","金","土"],

			textOK: 'オーケー',
			textCancel: 'キャンセル',
			textPrevYear: '前年',
			textNextYear: '来年',
			textPrevMonth: '前月',
			textNextMonth: '来月',
			defaultFormat: 'Y/m/d',
			dow: 0,
			textAMPM: ['午前','午後']
		},
		'ko': {	/* korean (ko) */
			// note: spaces after months names need for correct parsing of input string
			monthNames: ["1월 ","2월 ","3월 ","4월 ","5월 ","6월 ","7월 ","8월 ","9월 ","10월","11월","12월"],
			weekdays: ["일요일","월요일","화요일","수요일","목요일","금요일","토요일"],
			shortWeekdays: ["일","월","화","수","목","금","토"],

			textOK: '승인',
			textCancel: '취소',
			textPrevYear: '전년도',
			textNextYear: '내년에',
			textPrevMonth: '이전 달',
			textNextMonth: '다음 달',
			defaultFormat: 'Y. m. d',
			dow: 0,
			textAMPM: ['오전','오후']
		},
		'es': {	/* spanish (es) */
			monthNames: ["enero","febrero","marzo","abril","mayo","junio","julio",
							"agosto","septiembre","octubre","noviembre","diciembre"],
			weekdays: ["domingo","lunes","martes","miércoles","jueves","viernes","sábado"],
			shortWeekdays: ["Do","Lu","Ma","Mi","Ju","Vi","Sá"],

			textOK: 'bueno',
			textCancel: 'cancelar',
			textPrevYear: 'año anterior',
			textNextYear: 'año que viene',
			textPrevMonth: 'mes anterior',
			textNextMonth: 'mes próximo',
			defaultFormat: 'd/m/Y',
			textAMPM: ['a.m.','p.m.']
		},
		'pt': {	/* portuguese (pt) */
			monthNames: ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho",
							"Agosto","Setembro","Outubro","Novembro","Dezembro"],
			weekdays: ["Domingo","Segunda-feira","Terça-feira","Quarta-feira",
							"Quinta-feira","Sexta-feira","Sábado"],
			shortWeekdays: ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"],

			textOK: 'ok',
			textCancel: 'cancelar',
			textPrevYear: 'ano anterior',
			textNextYear: 'próximo ano',
			textPrevMonth: 'mês anterior',
			textNextMonth: 'próximo mês',
			defaultFormat: 'd/m/Y'
		},
		'it': {	/* italian (it) */
			monthNames: ["Gennaio","Febbraio","Marzo","Aprile","Maggio","Giugno","Luglio",
							"Agosto","Settembre","Ottobre","Novembre","Dicembre"],
			weekdays: ["Domenica","Lunedì","Martedì","Mercoledì","Giovedì","Venerdì","Sabato"],
			shortWeekdays: ["Dom","Lun","Mar","Mer","Gio","Ven","Sab"],

			textOK: 'bene',
			textCancel: 'annullare',
			textPrevYear: 'anno precedente',
			textNextYear: 'l\'anno prossimo',
			textPrevMonth: 'mese precedente',
			textNextMonth: 'mese prossimo',
			defaultFormat: 'd/m/Y',
			textAMPM: ['m.','p.']
		},
		'fi': {	/* finnish (fi) */
			monthNames: ["tammikuu","helmikuu","maaliskuu","huhtikuu","toukokuu","kesäkuu",
							"heinäkuu","elokuu","syyskuu","lokakuu","marraskuu","joulukuu"],
			weekdays: ["sunnuntai","maanantai","tiistai","keskiviikko","torstai","perjantai","lauantai"],
			shortWeekdays: ["su","ma","ti","ke","to","pe","la"],

			textOK: 'kunnossa',
			textCancel: 'peruuttaa',
			textPrevYear: 'edellisvuodesta',
			textNextYear: 'ensi vuonna',
			textPrevMonth: 'edellisen kuukauden',
			textNextMonth: 'ensi kuussa',
			defaultFormat: 'd.m.Y',
			textAMPM: ['ap.','ip.']
		},
		'sv': {	/* swedish (sv) */
			monthNames: ["januari","februari","mars","april","maj","juni","juli",
							"augusti","september","oktober","november","december"],
			weekdays: ["söndag","måndag","tisdag","onsdag","torsdag","fredag","lördag"],
			shortWeekdays: ["sön","mån","tis","ons","tor","fre","lör"],

			textOK: 'OK',
			textCancel: 'Avbryt',
			textPrevYear: 'föregående år',
			textNextYear: 'nästa år',
			textPrevMonth: 'föregående månad',
			textNextMonth: 'nästa månad',
			defaultFormat: 'Y-m-d',
			textAMPM: ['fm','em']
		},
		'uk': {	/* ukrainian (uk) */
			monthNames: ["січень","лютий","березень","квітень","травень","червень",
							"липень","серпень","вересень","жовтень","листопад","грудень"],
			weekdays: ["неділя","понеділок","вівторок","середа","четвер","п’ятниця","субота"],
			shortWeekdays: ["нд","пн","вт","ср","чт","пт","сб"],

			textOK: 'добре',
			textCancel: 'анулювати',
			textPrevYear: 'попередній рік',
			textNextYear: 'нарік',
			textPrevMonth: 'попередній місяць',
			textNextMonth: 'наступний місяць',
			defaultFormat: 'd.m.Y',
			textAMPM: ['дп','пп']
		},
		'pl': {	/* polish (pl) */
			monthNames: ["styczeń","luty","marzec","kwiecień","maj","czerwiec",
							"lipiec","sierpień","wrzesień","październik","listopad","grudzień"],
			weekdays: ["niedziela","poniedziałek","wtorek","środa","czwartek","piątek","sobota"],
			shortWeekdays: ["nie","pon","wt","śr","czw","pt","sb"],

			textOK: 'dobrze',
			textCancel: 'anulować',
			textPrevYear: 'poprzedni rok',
			textNextYear: 'przyszły rok',
			textPrevMonth: 'poprzedni miesiąc',
			textNextMonth: 'przyszły miesiąc',
			defaultFormat: 'd.m.Y'
		},
		'ar': {	/* arabic (ar) */
			monthNames: ["يناير/ كانون الثاني","فبراير/ شباط","مارس/ آذار","أبريل/ نيسان",
							"مايو/ أيار","يونيو/ حزيران","يوليو/ تموز","أغسطس/ آب","سبتمبر/ أيلول",
							"أكتوبر/ تشرين الأول","نوفمبر/ تشرين الثاني","ديسمبر/ كانون الأول"],
			weekdays: ["الأحد","الإثنين","الثلاثاء","الأربعاء","الخميس","الجمعة","السبت"],
			shortWeekdays: ["ح","ن","ث","ر","خ","ج","س"],

			textOK: 'حسنا',
			textCancel: 'إلغاء',
			textPrevYear: 'العام السابق',
			textNextYear: 'العام المقبل',
			textPrevMonth: 'الشهر السابق',
			textNextMonth: 'الشهر المقبل',
			defaultFormat: 'd/m/Y',
			dow: 6,
			textAMPM: ['ص','م']
		},
		'cs': {	/* czech (cs) */
			monthNames: ["leden","únor","březen","duben","květen","červen",
							"červenec","srpen","září","říjen","listopad","prosinec"],
			weekdays: ["neděle","pondělí","úterý","středa","čtvrtek","pátek","sobota"],
			shortWeekdays: ["ne","po","út","st","čt","pá","so"],

			textOK: 'dobře',
			textCancel: 'zrušit',
			textPrevYear: 'předchozí rok',
			textNextYear: 'příští rok',
			textPrevMonth: 'předchozí měsíc',
			textNextMonth: 'příští měsíc',
			defaultFormat: 'd.m.Y',
			textAMPM: ['dop.','odp.']
		},
		'ka': {	/* georgian (ka) */
			monthNames: ["იანვარი","თებერვალი","მარტი","აპრილი","მაისი","ივნისი",
							"ივლისი","აგვისტო","სექტემბერი","ოქტომბერი","ნოემბერი","დეკემბერი"],
			weekdays: ["კვირა","ორშაბათი","სამშაბათი","ოთხშაბათი","ხუთშაბათი","პარასკევი","შაბათი"],
			shortWeekdays: ["კვი","ორშ","სამ","ოთხ","ხუთ","პარ","შაბ"],
			textOK: 'OK',
			textCancel: 'გაუქმება',
			textPrevYear: 'ერთი წლის წინ',
			textNextYear: 'წლის წინ',
			textPrevMonth: 'წინა თვის',
			textNextMonth: 'მომდევნო თვეში',
			defaultFormat: 'd/m/Y',
			textAMPM: ['დილის','საღამოს']
		},
		'he': {	/* hebrew (he) */
			monthNames: ["ינואר","פברואר","מרץ","אפריל","מאי","יוני","יולי",
							"אוגוסט","ספטמבר","אוקטובר","נובמבר","דצמבר"],
			weekdays: ["יום ראשון","יום שני","יום שלישי","יום רביעי","יום חמישי","יום שישי","יום שבת"],
			shortWeekdays: ["א","ב","ג","ד","ה","ו","ש"],

			textOK: 'אישור',
			textCancel: 'לבטל',
			textPrevYear: 'שנה הקודמת',
			textNextYear: 'בשנה הבאה',
			textPrevMonth: 'חודש קודם',
			textNextMonth: 'בחודש הבא',
			defaultFormat: 'd/m/Y',
			dow: 0,
			textAMPM: ['לפנה"צ','אחה"צ']
		},
		'hi': {	/* hindi (hi) */
			monthNames: ["'जनवरी","फ़रवरी","मार्च","अप्रैल","मई ","जून ","जुलाई","अगस्त","सितम्बर","अक्टूबर","नवम्बर","दिसम्बर'"],
			weekdays: ["'रविवार","सोमवार","मंगलवार","बुधवार","गुरूवार","शुक्रवार","शनिवार"],
			shortWeekdays: ["'रवि","सोम","मंगल","बुध","गुरू","शुक्र","शनि"],

			textOK: 'ठीक',
			textCancel: 'रद्द करें',
			textPrevYear: 'पिछले वर्ष',
			textNextYear: 'अगले साल',
			textPrevMonth: 'पिछले माह',
			textNextMonth: 'अगले माह',
			defaultFormat: 'd/m/Y',
			dow: 0
		},
		'th': {	/* thai (th) */
			monthNames: ["มกราคม","กุมภาพันธ์","มีนาคม","เมษายน","พฤษภาคม","มิถุนายน","กรกฎาคม",
							"สิงหาคม","กันยายน","ตุลาคม","พฤศจิกายน","ธันวาคม"],
			weekdays: ["อาทิตย์","จันทร์","อังคาร","พุธ ","พฤหัสบดี","ศุกร์","เสาร์"],
			shortWeekdays: ["อา.","จ.","อ.","พ.","พฤ.","ศ.","ส."],

			textOK: 'ตกลง',
			textCancel: 'ยกเลิก',
			textPrevYear: 'เมื่อปีที่แล้ว',
			textNextYear: 'ในปีถัดไป',
			textPrevMonth: 'เดือนก่อน',
			textNextMonth: 'เดือนถัดไป',
			defaultFormat: 'Y/m/d',
			dow: 0,
			textAMPM: ['ก่อนเที่ยง','หลังเที่ยง']
		},
		'tr': {	/* turkish (tr) */
			monthNames: ["Ocak","Şubat","Mart","Nisan","Mayıs","Haziran","Temmuz",
							"Ağustos","Eylül","Ekim","Kasım","Aralık"],
			weekdays: ["Pazar","Pazartesi","Salı","Çarşamba","Perşembe","Cuma","Cumartesi"],
			shortWeekdays: ["Pz","Pt","Sa","Ça","Pe","Cu","Ct"],

			textOK: 'olur',
			textCancel: 'iptal',
			textPrevYear: 'geçen yılın',
			textNextYear: 'sonraki yıl',
			textPrevMonth: 'önceki aya',
			textNextMonth: 'gelecek ay',
			defaultFormat: 'd.m.Y'
		},
		'nl': {	/* dutch (nl) */
			monthNames: ["januari","februari","maart","april","mei","juni","juli",
							"augustus","september","oktober","november","december"],
			weekdays: ["zondag","maandag","dinsdag","woensdag","donderdag","vrijdag","zaterdag"],
			shortWeekdays: ["Zo","Ma","Di","Wo","Do","Vr","Za"],

			textOK: 'OK',
			textCancel: 'Annuller',
			textPrevYear: 'foregående år',
			textNextYear: 'næste år',
			textPrevMonth: 'foregående måned',
			textNextMonth: 'næste måned',
			defaultFormat: 'd-m-Y'
		},
		'id': {	/* Bahasa Indonesia (id) */
			monthNames: ["Januari","Februari","Maret","April","Mei","Juni","Juli",
							"Agustus","September","Oktober","November","Desember"],
			weekdays: ["Minggu","Senin","Selasa","Rabu","Kamis","Jumat","Sabtu"],
			shortWeekdays: ["Mg","Sn","Sl","Rb","Km","Jm","Sb"],

			textOK: 'oke',
			textCancel: 'membatalkan',
			textPrevYear: 'tahun sebelumnya',
			textNextYear: 'tahun depan',
			textPrevMonth: 'bulan sebelumnya',
			textNextMonth: 'bulan depan',
			defaultFormat: 'd/m/Y'
		},
		'bn': {	/* bengali (bn) */
			monthNames: ["জানুয়ারী", "ফেব্রুয়ারী", "মার্চ ", "এপ্রিল", "মে  ", "জুন ", "জুলাই",
							"আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর"],
			weekdays: ["রবিবার", "সোমবার", "মঙ্গলবার", "বুধবার", "বৃহস্পতিবার", "শুক্রবার", "শনিবার"],
			shortWeekdays: ["র", "সো", "ম", "বু",	"বৃ", "শু", "শ"],

			textOK: 'একদম ঠিক',
			textCancel: 'বাতিল করা',
			textPrevYear: 'পূর্ববর্তী বছরের',
			textNextYear: 'আগামী বছর',
			textPrevMonth: 'আগের মাসের',
			textNextMonth: 'আগামী মাসে',
			defaultFormat: 'j F, Y',
			textAMPM: ['পূর্বাহ্ণ','অপরাহ্ণ']
		},
		'sr': {	/* serbian (sr) */
			monthNames: ["јануар", "фебруар", "март", "април", "мај", "јун", "јул",
							"август", "септембар", "октобар", "новембар", "децембар"],
			weekdays: ["недеља", "понедељак", "уторак", "среда",
								"четвртак", "петак", "субота"],
			shortWeekdays: ["н", "п", "у", "с",	"ч", "п", "с"],

			textOK: 'у реду',
			textCancel: 'отказати',
			textPrevYear: 'претходна година',
			textNextYear: 'следеће године',
			textPrevMonth: 'претходни месец',
			textNextMonth: 'следећи месец',
			defaultFormat: 'd.m.Y.',
			textAMPM: ['пре подне','поподне']
		},
		'hy': {	/* armenian (hy) */
			monthNames: ["Յունուար", "Փետրուար", "Մարտ", "Ապրիլ", "Մայիս", "Յունիս", 
							"Յուլիս", "Օգոստոս", "Սեպտեմբեր", "Հոկտեմբեր", "Նոյեմբեր", "Դեկտեմբեր"],
			weekdays: ["Կիրակի", "Երկուշաբթի", "Երեքշաբթի", "Չորեքշաբթի",
								"Հինգշաբթի", "Ուրբաթ", "Շաբաթ"],
			shortWeekdays: ["Կիր", "Երկ", "Երք", "Չոր", "Հնգ", "Ուր", "Շաբ"],

			textOK: 'լավ',
			textCancel: 'վերացնել',
			textPrevYear: 'նախորդ տարվա',
			textNextYear: 'Հաջորդ տարի',
			textPrevMonth: 'Նախորդ ամիս',
			textNextMonth: 'հաջորդ ամիս',
			defaultFormat: 'l, F j, Y',
			textAMPM: ['Առ․','Եր․']
		},
		'fa': {	/* persian (fa) */
			monthNames: ["ژانویه","فوریه","مارس","آوریل","مه","ژوئن","ژوئیه",
							"اوت","سپتامبر","اکتبر","نوامبر","دسامبر"],
			weekdays: ["یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه",
								"پنجشنبه", "جمعه", "شنبه"],
			shortWeekdays: ["ی","د","س","چ","پ","ج","ش"],

			textOK: 'خوب',
			textCancel: 'لغو کردن',
			textPrevYear: 'سال گذشته',
			textNextYear: 'در سال آینده',
			textPrevMonth: 'ماه گذشته',
			textNextMonth: 'ماه آینده',
			defaultFormat: 'j Y F',
			dow: 6,	// اولین روز از هفته
			textAMPM: ['اولین روز از هفته','بعد از ظهر']
		},
		'el': {	/* modern greek (el) */
			monthNames: ["Ιανουάριος","Φεβρουάριος","Μάρτιος","Απρίλιος","Μάιος","Ιούνιος","Ιούλιος",
							"Αύγουστος","Σεπτέμβριος","Οκτώβριος","Νοέμβριος","Δεκέμβριος"],
			weekdays: ["Κυριακή","Δευτέρα","Τρίτη","Τετάρτη","Πέμπτη","Παρασκευή","Σάββατο"],
			shortWeekdays: ["Κυ","Δε","Τρ","Τε","Πε","Πα","Σα"],

			textOK: 'καλά',
			textCancel: 'ματαιώνω',
			textPrevYear: 'προηγούμενο έτος',
			textNextYear: 'του χρόνου',
			textPrevMonth: 'προηγούμενο μήνα',
			textNextMonth: 'επόμενο μήνα',
			defaultFormat: 'd/m/Y',
			textAMPM: ['π.μ.','μ.μ.']
		}
	};
	
	// chose and return valid localization
	// Default is `en`
	if(lang in langs)
		return langs[lang];
	return langs['en'];
};

JustCal.getTheme = function(theme)
{
	// themes: jungle, neutral, marine, frog, orange
	var themes = {
		'jungle': {
			mainBorder: "5px double #000",	// border style of the whole widget
			mainBgColor: "#FFF", 	// background color of the whole widget
			weekHeaderColor: "#18861B",	// background color in week header
			weekFontColor: "#FFF",		// font color in week header
			SundayColor: "#C0F64F", 	// background color of Sunday
			SaturdayColor: "#C0F64F", 	// background color of Saturday
			weekDayColor: "#FFEDA6", 	// background color of weekdays
			todayColor: "#FFBD35", 		// background color of today
			selectedColor: "#F80B3C", 	// background color of selected date in textbox
			cycleColor: "#C03", 		// font color of Year/Month cycling tag brackets (<,<<,>,>>)
			hoverColor: "#00638F", 		// background color when mouse move over
			disabledColor: "#996" 		// background color of disabled cell
		},
		'neutral': {
			mainBorder: "double 5px #000",	// border style of the whole widget
			mainBgColor: "#FFF", 		// background color of the whole widget
			weekHeaderColor: "#D5D5D5",	// background color in week header
			weekFontColor: "#FFF",		// font color in week header
			SundayColor: "#D5D5D5", 	// background color of Sunday
			SaturdayColor: "#D5D5D5", 	// background color of Saturday
			weekDayColor: "#EEE", 		// background color of weekdays
			todayColor: "#CCA", 		// background color of today
			selectedColor: "#999",	 	// background color of selected date in textbox
			cycleColor: "#222", 		// font color of Year/Month cycling tag brackets (<,<<,>,>>)
			hoverColor: "#999", 		// background color when mouse move over
			disabledColor: "#555" 		// background color of disabled cell
		},
		'marine': {
			mainBorder: "double 5px #000",	// border style of the whole widget
			mainBgColor: "#FFF", 		// background color of the whole widget
			weekHeaderColor: "#1E8FB7",	// background color in week header
			weekFontColor: "#FFF",		// font color in week header
			SundayColor: "#6498FE", 	// background color of Sunday
			SaturdayColor: "#6498FE", 	// background color of Saturday
			weekDayColor: "#C6C3FF", 	// background color of weekdays
			todayColor: "#669", 		// background color of today
			selectedColor: "#55C", 		// background color of selected date in textbox
			cycleColor: "blue", 		// font color of Year/Month cycling tag brackets (<,<<,>,>>)
			hoverColor: "#55C", 		// background color when mouse move over
			disabledColor: "#666" 		// background color of disabled cell
		},
		'frog': {
			mainBorder: "double 5px #000",	// border style of the whole widget
			mainBgColor: "#FFF", 		// background color of the whole widget
			weekHeaderColor: "#35650F",	// background color in week header
			weekFontColor: "#F9DD34",	// font color in week header
			cycleColor: "#59A91C", 		// font color of Year/Month cycling tag brackets (<,<<,>,>>)
			SundayColor: "#35650F", 	// background color of Sunday
			SaturdayColor: "#35650F", 	// background color of Saturday
			weekDayColor: "#59A91C", 	// background color of weekdays
			todayColor: "#F9DD34", 		// background color of today
			selectedColor: "#FCF7DA", 	// background color of selected date in textbox
			hoverColor: "#FCF7DA", 		// background color when mouse move over
			disabledColor: "#C0C0C1" 	// background color of disabled cell
		},
		'orange': {
			mainBorder: "double 5px #000",	// border style of the whole widget
			mainBgColor: "#FFF", 		// background color of the whole widget
			weekHeaderColor: "#F39F00",	// background color in week header
			weekFontColor: "#FAE3BF",	// font color in week header
			cycleColor: "#C85900", 		// font color of Year/Month cycling tag brackets (<,<<,>,>>)
			SundayColor: "#FFA500", 	// background color of Sunday
			SaturdayColor: "#FFA500", 	// background color of Saturday
			weekDayColor: "#C85900", 	// background color of weekdays
			todayColor: "#EF7730", 		// background color of today
			selectedColor: "#F8DDCA", 	// background color of selected date in textbox
			hoverColor: "#F8DDCA", 		// background color when mouse move over
			disabledColor: "#C0C0C1" 	// background color of disabled cell
		}
	};
	// return valid theme, defaults to jungle theme
	if(theme in themes)
		return themes[theme];
	return themes['jungle'];
};

	/**
		DOM helper functions
	**/
	var DOM_helper = 
	{
		attach: function(element, type, fn){
			if (element.addEventListener){
				element.addEventListener(type, fn, false);
			} else if (element.attachEvent){
				element.attachEvent('on' + type, fn);
			}
		},

		// return current scroll offsets
		getScrollOffsets: function(w) {
			w = w || window;
			if(w.pageXOffset != null)
				return { x: w.pageXOffset, y: w.pageYOffset };

			var d = w.document;
			if(document.compatMode == 'CSS1Compat')
				return { x: d.documentElement.scrollLeft, y: d.documentElement.scrollTop };

			// quirks mode?
			return { x: d.body.scrollLeft, y: d.body.scrollTop };
		},

		// return size of current viewport
		getViewportSize: function(w) {
			w = w || window;
			var d = w.document;

			if(document.compatMode == 'CSS1Compat')
				return { w: d.documentElement.clientWidth, h: d.documentElement.clientHeight };

			// quirks mode?
			return { w: d.body.clientWidth, h: d.body.clientHeight };
		},

		// find page position of an element e
		findPos: function(e) {
			var x = 0, y = 0;
			if(e.getBoundingClientRect) {
				var box = e.getBoundingClientRect();
				var scrolls = DOM_helper.getScrollOffsets();
				return { x: box.left + scrolls.x, y:box.top + scrolls.y };
			}
			while(e) {
				x += e.offsetLeft;
				y += e.offsetTop;
				e = e.offsetParent;
			}
			return { x:x, y:y };
		},
		
		// cancel event bubbling for W3C & IE<9
		preventDefault: function(e) {
			if (e.preventDefault) {
				e.preventDefault();
				e.stopPropagation();
			}
			else {
				e.returnValue = false;
				e.cancelBubble = true;
			}
		}
	};

})();
