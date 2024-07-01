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

const { checkInDB, recordInTime, recordOutTime, displayLoginTime, displayLogoutTime, allRecord, 
    monthHoliday, fetchHoliday, leaveRecord, fetchLeave, pendingRecord, eachEmpLeaves, updateApprove, 
    updateReject, addLeave, monthlyRecord, checkAllAbsent, LateCount, displayEmpId, employeeName, 
    empIdName, onLeave, Birthday, employeeRecord, singleEmployee, leavesUsed, 
    empLeaves, monthwiseLeaves, futureLeaves, countDays, workingHours, Monthwise, leaveCounts, 
    changePassword, addRegister, UpdateRegister, RoleChange, FetchEmployee, addOfficialDuty, 
    pendingOfficialDuty, eachEmpOfficialDuty, updateApproveForOD, updatePullbackForOD, updateRejectForOD, 
    fetchOfficialDuty, monthlyWorkingHours, insertWFHLogin, insertODLogin, addTroubleshoot, fetchIssue} = require('./files/index')

app.get('/login', checkInDB);
app.post('/intime', recordInTime);
app.get('/outtime', recordOutTime);
app.get('/time', displayLoginTime);
app.get('/logout', displayLogoutTime);
app.get('/calendar', allRecord);
app.get('/monthHoliday', monthHoliday);
app.get('/holiday', fetchHoliday);
app.post('/leave', leaveRecord);
app.get('/fetch', fetchLeave);
app.get('/pending', pendingRecord);
app.get('/eachEmpLeaves', eachEmpLeaves);
app.put('/approve', updateApprove);
app.put('/reject', updateReject);
app.post('/addleave', addLeave);
app.get('/latecount', LateCount);
app.get('/empid', displayEmpId);
app.post('/addRegister', addRegister);
app.post('/UpdateRegister', UpdateRegister);
app.post('/RoleChange', RoleChange);
app.get('/FetchEmployee', FetchEmployee);
app.get('/month', monthlyRecord);
app.get('/absent', checkAllAbsent);
app.get('/empname', employeeName);
app.get('/empidname', empIdName);
app.get('/allEmp', employeeRecord);
app.get('/singleEmp', singleEmployee);
app.get('/used', leavesUsed);
app.get('/empleaves', empLeaves);
app.get('/monthLeaves', monthwiseLeaves);
app.get('/future', futureLeaves);
app.get('/todayleave', onLeave);
app.get('/bday', Birthday);
app.get('/countdays', countDays);
app.get('/monthwise', Monthwise);
app.get('/count', leaveCounts);
app.get('/workingHours', workingHours);
app.put('/password', changePassword);
app.post('/addOfficialDuty', addOfficialDuty);
app.get('/pendingOfficialDuty', pendingOfficialDuty);
app.get('/eachEmpOfficialDuty', eachEmpOfficialDuty);
app.put('/updateApproveForOD', updateApproveForOD);
app.put('/updatePullbackForOD', updatePullbackForOD);
app.put('/updateRejectForOD', updateRejectForOD);
app.get('/fetchOfficialDuty', fetchOfficialDuty);
app.get('/monthlyWorkingHours', monthlyWorkingHours);
app.post('/insertWFHLogin', insertWFHLogin);
app.post('/insertODLogin', insertODLogin);
app.post('/addTroubleshoot', addTroubleshoot);
app.get('/fetchIssue', fetchIssue);

app.use(express.static('public'));

const port = process.env.SERVER_PORT
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
})

