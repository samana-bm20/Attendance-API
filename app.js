const express = require('express');
const mssql = require('mssql');
const dotenv = require('dotenv');
const cors = require('cors');
const request = require('request');
const bodyParser = require('body-parser');

const app = express();

let result = dotenv.config();
if (result.error) {
    throw result.error;
}

app.use(cors());
app.options('*', cors())

const config = {
    port: parseInt(process.env.DB_PORT),
    server: process.env.DB_SERVER,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    options: {
        "requestTimeout": 300000,
        useUTC: true,
        encrypt: true,
        enableArithAbot: true,
        trustedConnection: true,
        trustServerCertificate: true,
    },
}

const pool = mssql.connect(config)
if (pool) {
    console.log(`connected to database sql server`)
} else {
    console.log(`not connected to database`)
}

global.db = mssql;
global.config = config;
global.request = request;

app.use(bodyParser.json({ limit: "2048mb" }));
app.use(bodyParser.urlencoded({ limit: "2048mb", extended: true }));
app.use(bodyParser.json());

const { checkInDB, insertInDB, recordOutTime, displayName,
    displayDesignation, displayEmpId, displayLoginTime, displayLogoutTime,
    allRecord, leaveRecord, monthHoliday, fetchHoliday, fetchLeave, 
    pendingRecord, updateApprove, updateReject, monthlyRecord, 
    monthlyEmployee, checkAllAbsent, addLeave, LateCount, employeeName, 
    empIdName, onLeave, Birthday, employeeRecord, singleEmployee, deleteLeave, 
    leavesUsed, empLeaves, futureLeaves, countDays, leaveCounts } = require('./files/index')

app.get('/login', checkInDB);
app.post('/record', insertInDB);
app.get('/outtime', recordOutTime);
app.get('/name', displayName);
app.get('/position', displayDesignation);
app.get('/empid', displayEmpId);
app.get('/time', displayLoginTime);
app.get('/logout', displayLogoutTime);
app.get('/calendar', allRecord);
app.post('/leave', leaveRecord);
app.get('/monthHoliday', monthHoliday);
app.get('/holiday', fetchHoliday);
app.get('/fetch', fetchLeave);
app.get('/pending', pendingRecord);
app.put('/approve', updateApprove);
app.post('/addleave', addLeave);
app.get('/latecount', LateCount);
app.put('/reject', updateReject);
app.get('/month', monthlyRecord);
app.get('/empdata', monthlyEmployee);
app.get('/absent', checkAllAbsent);
app.get('/empname', employeeName);
app.get('/empidname', empIdName);
app.get('/admin', employeeRecord);
app.get('/singleEmp', singleEmployee);
app.put('/delete', deleteLeave);
app.get('/used', leavesUsed);
app.get('/empleaves', empLeaves);
app.get('/future', futureLeaves);
app.get('/todayleave', onLeave);
app.get('/bday', Birthday);
app.get('/countdays', countDays);
app.get('/count', leaveCounts);

app.use(express.static('public'));

const port = process.env.SERVER_PORT
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
})

