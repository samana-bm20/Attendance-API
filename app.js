const express = require('express');
const mssql = require('mssql');
const dotenv = require('dotenv');
const cors = require('cors');
const request = require('request');
const path = require('path');
const bodyParser = require('body-parser');
const multer = require('multer');
const bcrypt = require('bcrypt');
const fs = require('fs');

const app = express();

let result = dotenv.config();
if (result.error) {
    throw result.error;
}

app.use('/public', express.static(path.join(__dirname, 'public'))); // use this for upload files or take control of public folder
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const storage_ = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname.split('.')[0] + Date.now() + path.extname(file.originalname));
    }
});
const upload_ = multer({ storage: storage_ });


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
global.fs = fs;
global.path = path;
global.bcrypt = bcrypt;

app.use(bodyParser.json({ limit: "2048mb" }));
app.use(bodyParser.urlencoded({ limit: "2048mb", extended: true }));
app.use(bodyParser.json());

const { checkInDB, recordInTime, recordOutTime, displayLoginTime, displayLogoutTime, allRecord,
    monthHoliday, fetchHoliday, fetchLeave, pendingRecord, eachEmpLeaves, updateApprove, updateRejectPullback,
    deleteApproved, addLeave, monthlyRecord, checkAllAbsent, LateCount, displayEmpId, employeeName,
    empIdName, onLeave, Birthday, employeeRecord, singleEmployee, paidLeaves, leavesUsed,
    empLeaves, monthwiseLeaves, futureLeaves, countDays, workingHours, Monthwise, leaveCounts,
    changePassword, addRegister, UpdateRegister, RoleChange, FetchEmployee, addOfficialDuty,
    pendingOfficialDuty, eachEmpOfficialDuty, updateApproveForOD, updatePullbackForOD, updateRejectForOD,
    fetchOfficialDuty, monthlyWorkingHours, insertWFHLogin, insertODLogin, addLog, fetchLog, editLog, 
    salaryReportMonthWise, getInformation, updateEmail, updateContact, updateSecondaryContact, 
    updateQualification, updateSkillSet1, updateSkillSet2, updateSkillSet3, updateSkillSet4,
    profilePictureUpload, getProfilePhoto, getPersonalDetails, updateCurrentAddress, updatePermanentAddress,
    documentUpload, getDocuments, removeDocument, updateDependency, getHolidayList, getEmployeeDOJ } = require('./files/index')

app.get('/login', checkInDB);
app.post('/intime', recordInTime);
app.get('/outtime', recordOutTime);
app.get('/time', displayLoginTime);
app.get('/logout', displayLogoutTime);

app.get('/calendar', allRecord);
app.get('/monthHoliday', monthHoliday);
app.get('/holiday', fetchHoliday);
app.get('/fetch', fetchLeave);
app.get('/pending', pendingRecord);
app.get('/eachEmpLeaves', eachEmpLeaves);
app.put('/approve', updateApprove);
app.put('/rejectPullback', updateRejectPullback);
app.post('/deleteApproved', deleteApproved);
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

app.get('/paidLeaves', paidLeaves);
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

app.post('/addLog', addLog);
app.put('/editLog', editLog);
app.get('/fetchLog', fetchLog);
app.get('/salaryReportMonthWise', salaryReportMonthWise);

app.get('/getInformation', getInformation);
app.put('/updateEmail', updateEmail);
app.put('/updateContact', updateContact);
app.put('/updateSecondaryContact', updateSecondaryContact);
app.put('/updateQualification', updateQualification);
app.put('/updateSkillSet1', updateSkillSet1);
app.put('/updateSkillSet2', updateSkillSet2);
app.put('/updateSkillSet3', updateSkillSet3);
app.put('/updateSkillSet4', updateSkillSet4);
app.post('/profilePictureUpload', upload.single('profilePicture'), profilePictureUpload);
app.get('/getProfilePhoto', getProfilePhoto);

app.get('/getPersonalDetails', getPersonalDetails);
app.put('/updateCurrentAddress', updateCurrentAddress);
app.put('/updatePermanentAddress', updatePermanentAddress);
app.post('/documentUpload', upload_.single('file'), documentUpload);
app.get('/getDocuments', getDocuments);
app.get('/removeDocument', removeDocument);
app.put('/updateDependency', updateDependency);
app.get('/getHolidayList', getHolidayList);
app.get('/getEmployeeDOJ', getEmployeeDOJ);

app.use(express.static('public'));

const port = process.env.SERVER_PORT
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
})

