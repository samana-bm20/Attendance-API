const db = global.db;
const config = global.config;
const bcrypt = require('bcrypt');
const saltRounds = 6;

module.exports = {
  checkInDB: (req, res) => {
    const username = req.query.username;
    const password = req.query.password;

    try {
      const query = `SELECT [name], [username], [empid], [userType], [designation], [password] 
      FROM Users 
      WHERE username = '${username}' AND  isStatus='1';`;

      db.connect(config, function (error) {
        if (error) {
          console.log(error);
          return res.status(500).json({ status: 'NOK', data: error, message: 'Database connection error' });
        }

        var request = new db.Request();
        request.input('username', db.VarChar, username);
        request.query(query, async (error, result) => {
          if (error) {
            return res.status(404).json({ status: 'Not Found', data: error, message: "Invalid user" });
          } else {
            if (result.recordset.length > 0) {
              const storedPassword = result.recordset[0].password;

              const isMatch = await bcrypt.compare(password, storedPassword);

              if (isMatch || storedPassword === password) {
                return res.status(200).json({ status: 'OK', data: result.recordset, message: "User authenticated successfully" });
              } else {
                return res.status(200).json({ status: 'NOK', data: [], message: "User credentials are incorrect" });
              }
            } else {
              return res.status(200).json({ status: 'NOK', data: [], message: "User credentials are incorrect" });
            }
          }
        });
      });
    } catch (error) {
      return res.status(500).json({ status: 'NOK', data: error, message: 'Internal server error' });
    }
  },
  recordInTime: (req, res) => {
    const username = req.body.username;
    const fullname = req.body.fullname;
    const empid = req.body.empid;
    try {
      let inTimeQuery = `INSERT INTO [LoginRecord] (username, logintime, fullName, empid)
      SELECT '${username}', GETDATE(), '${fullname}', '${empid}'
      WHERE NOT EXISTS (
      SELECT 1
      FROM [LoginRecord]
      WHERE username = '${username}'
        AND CAST(logintime AS DATE) = CAST(GETDATE() AS DATE)
      );`;
      db.connect(config, function (error) {
        if (error)
          console.log(error);
        var request = new db.Request();
        request.query(inTimeQuery, (error, result) => {
          if (error) {
            return res.status(404).json({ status: 'Not Found', data: error, message: "Error in inserting data" })
          } else {
            return res.status(200).json({ status: 'OK', data: result.recordset, message: "Login details recorded successfully" })
          }
        });
      });
    } catch (error) {
      return res.status(500).json({ status: 'NOK', data: error, message: "Internal server error" })
    }
  },
  recordOutTime: (req, res) => {
    const username = req.query.username;
    try {
      let outTimeQuery = `update LoginRecord
      set logoutTime = GETDATE()
      where username = '${username}'
      and FORMAT(logintime, 'dd-MM-yyyy') = FORMAT(GETDATE(), 'dd-MM-yyyy');`;
      db.connect(config, function (error) {
        if (error)
          console.log(error);
        var request = new db.Request();
        request.query(outTimeQuery, (error, result) => {
          if (error) {
            return res.status(404).json({ status: 'Not Found', data: error, message: "Error in inserting data" })
          } else {
            return res.status(200).json({ status: 'OK', data: result.recordset, message: "Logout details recorded successfully" })
          }
        });
      });
    } catch (error) {
      return res.status(500).json({ status: 'NOK', data: error, message: "Internal server error" })
    }
  },
  displayLoginTime: (req, res) => {
    const username = req.query.username;
    try {
      const fetchQuery = `SELECT 
      FORMAT(MIN(logintime), 'dd-MMM-yyyy (dddd), hh:mm tt') AS loginTime
       FROM LoginRecord 
       WHERE username = '${username}' 
       AND FORMAT(logintime, 'dd-MM-yyyy') = FORMAT(GETDATE(), 'dd-MM-yyyy');`;
      db.connect(config, function (error) {
        if (error) {
          console.log(error);
          return res.status(500).json({ status: 'NOK', data: error, message: 'Database connection error' });
        }
        var request = new db.Request();
        request.query(fetchQuery, (error, result) => {
          if (error) {
            return res.status(404).json({ status: 'Not Found', data: error, message: "Error fetching login time" })
          }
          else {
            const time = result.recordset[0].loginTime;
            return res.status(200).json({ status: 'OK', data: time, message: "Login time displayed" });
          }
        });
      });
    } catch (error) {
      return res.status(500).json({ status: 'NOK', data: error, message: 'Internal server error' });
    }
  },
  displayLogoutTime: (req, res) => {
    const username = req.query.username;
    try {
      const fetchQuery = `SELECT 
      FORMAT(MAX(logoutTime), 'hh:mm tt') AS logoutTime
       FROM LoginRecord 
       WHERE username = '${username}' 
       AND FORMAT(logoutTime, 'dd-MM-yyyy') = FORMAT(GETDATE(), 'dd-MM-yyyy');`;
      db.connect(config, function (error) {
        if (error) {
          console.log(error);
          return res.status(500).json({ status: 'NOK', data: error, message: 'Database connection error' });
        }
        var request = new db.Request();
        request.query(fetchQuery, (error, result) => {
          if (error) {
            return res.status(404).json({ status: 'Not Found', data: error, message: "Error fetching logout time" })
          }
          else {
            const outtime = result.recordset[0].logoutTime;
            return res.status(200).json({ status: 'OK', data: outtime, message: "Logout time displayed" });
          }
        });
      });
    } catch (error) {
      return res.status(500).json({ status: 'NOK', data: error, message: 'Internal server error' });
    }
  },
  allRecord: (req, res) => {
    const username = req.query.username;
    const startDate = req.query.startDate;
    const endDate = req.query.endDate;
    try {
      const calendarQuery = `DECLARE @startDate DATETIME, @endDate DATETIME
      SET @startDate = '${startDate}'
      SET @endDate = '${endDate}';
      --SET @endDate = DATEADD(DAY, -2, DATEADD(MONTH, 1, @startDate));
            WITH DateRange AS (
                SELECT @startDate AS Date
                UNION ALL
                SELECT DATEADD(DAY, 1, Date)
                FROM DateRange
                WHERE Date < @endDate
            )
            
            SELECT 
                FORMAT(dr.Date, 'dd-MMM-yyyy') AS Date,
                FORMAT(MIN(lr.logintime), 'hh:mm tt') AS LoginTime
            FROM DateRange dr
            LEFT JOIN LoginRecord lr ON FORMAT(lr.logintime, 'dd-MMM-yyyy') = FORMAT(dr.Date, 'dd-MMM-yyyy')
                AND lr.username = '${username}'
				where CAST(dr.Date AS DATE) >= (
				select CAST(min(lr.logintime) AS DATE) from LoginRecord lr where lr.username = '${username}'
				)
            GROUP BY dr.Date
            OPTION (MAXRECURSION 0);`;
      db.connect(config, function (error) {
        if (error) {
          console.log(error);
          return res.status(500).json({ status: 'NOK', data: error, message: 'Database connection error' });
        }
        var request = new db.Request();
        request.query(calendarQuery, (error, result) => {
          if (error) {
            return res.status(404).json({ status: 'Not Found', data: error, message: "Error fetching full report" })
          }
          else {
            const allRecord = result.recordset.map(record => ({
              date: record.Date,
              time: record.LoginTime
            }));
            return res.status(200).json({ status: 'OK', data: allRecord, message: "full report displayed" });
          }
        });
      });
    } catch (error) {
      return res.status(500).json({ status: 'NOK', data: error, message: 'Internal server error' });
    }
  },
  addRegister: async (req, res) => {
    const username = req.body.username.trim();
    const password = req.body.password.trim();
    const name = req.body.name.trim();
    const designation = req.body.designation.trim();
    const empid = req.body.empid.trim();
    const birthday = new Date(req.body.birthday);
    const fromDate = birthday.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).replace(/ /g, '-');
    try {
      const hashedPassword = await bcrypt.hash(password, saltRounds);
      let addRegisterQuery = `SELECT username FROM Users where username='${username}'`;
      db.connect(config, function (error) {
        if (error) {
          console.log(error);
          return res.status(500).json({ status: 'NOK', data: error, message: 'Database connection error' });
        }
        var request1 = new db.Request();
        request1.query(addRegisterQuery, (error, result) => {
          if (error) {
            return res.status(404).json({ status: 'Not Found', data: error, message: "Error adding employee" })
          }
          else {
            if (result.recordset.length > 0) {
              return res.status(200).json({ status: 'NOK', data: result.recordset, message: "Error adding employee" });
            }
            else {
              let pendingQuery2 = `SELECT empid FROM Users where empid='${empid}'`;
              db.connect(config, function (error) {
                if (error) {
                  console.log(error);
                  return res.status(500).json({ status: 'NOK', data: error, message: 'Database connection error' });
                }
                var request2 = new db.Request();
                request2.query(pendingQuery2, (error2, result2) => {
                  if (error2) {
                    return res.status(404).json({ status: 'Not Found', data: error2, message: "Error fetching pending records" })
                  }
                  else {
                    if (result2.recordset.length > 0) {
                      return res.status(200).json({ status: 'NOK', data: result.recordset, message: "Employee Id already exists" });
                    }
                    else {
                      const addleaveQuery = `INSERT INTO [dbo].[Users] ([username] ,[password] ,[name] ,[designation] ,[empid] ,[userType] ,[isStatus] ,[birthday]) VALUES ('${username}' ,'${hashedPassword}' ,'${name}' ,'${designation}' ,'${empid}' ,2,1,'${fromDate}')`;
                      db.connect(config, function (error) {
                        if (error) {
                          console.log(error);
                          return res.status(500).json({ status: 'NOK', data: error, message: 'Database connection error' });
                        }
                        var request = new db.Request();
                        request.query(addleaveQuery, (error, result) => {
                          if (error) {
                            return res.status(404).json({ status: 'NOK', data: error, message: "Error adding leave request" })
                          }
                          else {
                            return res.status(200).json({ status: 'OK', data: result.recordset, message: "Employee has been successfuly added" });
                          }
                        });
                      });
                    }

                  }
                });
              });
            }

          }
        });
      });
    } catch (error) {
      return res.status(500).json({ status: 'NOK', data: error, message: 'Internal server error' });
    }
  },
  UpdateRegister: async (req, res) => {
    const uid = req.body.uid;
    const password = req.body.password.trim();
    const name = req.body.name.trim();
    const designation = req.body.designation.trim();
    const statusEmploy = req.body.statusEmploy;
    const birthday = new Date(req.body.birthday);
    const fromDate = birthday.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).replace(/ /g, '-');

    try {
      const hashedPassword = await bcrypt.hash(password, saltRounds);
      const updateUserQuery = `UPDATE [dbo].[Users] SET [password] = '${hashedPassword}', [name] = '${name}', [designation] = '${designation}', [isStatus] = LTRIM(RTRIM('${statusEmploy}')), [birthday] = '${fromDate}' WHERE [uid] = '${uid}'`;
      db.connect(config, function (error) {
        if (error) {
          console.log(error);
          return res.status(500).json({ status: 'NOK', data: error, message: 'Database connection error' });
        }
        var request = new db.Request();
        request.query(updateUserQuery, (error, result) => {
          if (error) {
            return res.status(404).json({ status: 'NOK', data: error, message: "Error in updating employee details" })
          }
          else {
            return res.status(200).json({ status: 'OK', data: result.recordset, message: "Employee details updated successfully" });
          }
        });
      });
    } catch (error) {
      return res.status(500).json({ status: 'NOK', data: error, message: 'Internal server error' });
    }
  },
  RoleChange: (req, res) => {
    const userType = req.body.userType;
    const uid = req.body.uid;
    try {
      const roleChangeQuery = `UPDATE [dbo].[Users] SET [userType] = '${userType}' WHERE [uid] = '${uid}'`;
      db.connect(config, function (error) {
        if (error) {
          console.log(error);
          return res.status(500).json({ status: 'NOK', data: error, message: 'Database connection error' });
        }
        var request = new db.Request();
        request.query(roleChangeQuery, (error, result) => {
          if (error) {
            return res.status(404).json({ status: 'NOK', data: error, message: "Error changing role" })
          }
          else {
            return res.status(200).json({ status: 'OK', data: result.recordset, message: "Role changed successfully" });
          }
        });
      });
    } catch (error) {
      return res.status(500).json({ status: 'NOK', data: error, message: 'Internal server error' });
    }
  },
  FetchEmployee: (req, res) => {
    try {
      let fetchEmpQuery = `SELECT ROW_NUMBER() OVER (ORDER BY birthday) AS SNo, uid
      ,username
      ,password
      ,name
      ,designation
      ,empid
      ,userType
      ,isStatus
      ,FORMAT(birthday, 'dd-MMM-yyyy') AS birthday
      FROM Users`;
      db.connect(config, function (error) {
        if (error) {
          console.log(error);
          return res.status(500).json({ status: 'NOK', data: error, message: 'Database connection error' });
        }
        var request = new db.Request();
        request.query(fetchEmpQuery, (error, result) => {
          if (error) {
            return res.status(404).json({ status: 'Not Found', data: error, message: "Error fetching employee records" })
          }
          else {
            return res.status(200).json({ status: 'OK', data: result.recordset, message: "Employee records displayed" });
          }
        });
      });
    } catch (error) {
      return res.status(500).json({ status: 'NOK', data: error, message: 'Internal server error' });
    }
  },
  monthHoliday: (req, res) => {
    const startDate = req.query.startDate;
    const endDate = req.query.endDate;
    try {
      const fetchHolidayQuery = `SELECT 
      FORMAT(Date, 'dd-MMM-yyyy') AS Date,
      FORMAT(Date, 'dddd') AS Day,
      HolidayName
      from Holiday
	  	  where Date BETWEEN '${startDate}' AND '${endDate}';`;
      db.connect(config, function (error) {
        if (error) {
          console.log(error);
          return res.status(500).json({ status: 'NOK', data: error, message: 'Database connection error' });
        }
        var request = new db.Request();
        request.query(fetchHolidayQuery, (error, result) => {
          if (error) {
            return res.status(404).json({ status: 'Not Found', data: error, message: "Error fetching public holidays" })
          }
          else {
            return res.status(200).json({ status: 'OK', data: result.recordset, message: "public holidays displayed" });
          }
        });
      });
    } catch (error) {
      return res.status(500).json({ status: 'NOK', data: error, message: 'Internal server error' });
    }
  },
  fetchHoliday: (req, res) => {
    try {
      const fetchHolidayQuery = `SELECT 
      FORMAT(Date, 'dd-MMM-yyyy') AS Date,
      FORMAT(Date, 'dddd') AS Day,
      HolidayName
      from Holiday;`;
      db.connect(config, function (error) {
        if (error) {
          console.log(error);
          return res.status(500).json({ status: 'NOK', data: error, message: 'Database connection error' });
        }
        var request = new db.Request();
        request.query(fetchHolidayQuery, (error, result) => {
          if (error) {
            return res.status(404).json({ status: 'Not Found', data: error, message: "Error fetching public holidays" })
          }
          else {
            return res.status(200).json({ status: 'OK', data: result.recordset, message: "public holidays displayed" });
          }
        });
      });
    } catch (error) {
      return res.status(500).json({ status: 'NOK', data: error, message: 'Internal server error' });
    }
  },
  leaveRecord: (req, res) => {
    const empID = req.body.empID;
    const name = req.body.name;
    const fromDateRAW = new Date(req.body.fromDate);
    const toDateRAW = new Date(req.body.toDate);
    const totalLeave = req.body.totalLeave;
    const fullDay = req.body.fullDay;
    const firstHalf = req.body.firstHalf;
    const secondHalf = req.body.secondHalf;
    const reason = req.body.reason;

    const fromDate = fromDateRAW.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).replace(/ /g, '-');

    const toDate = toDateRAW.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).replace(/ /g, '-');

    try {
      let leaveQuery = `INSERT INTO LeaveRecord 
      (EmpID, EmpName, FromDate, ToDate, NoOfLeave, FullDay, FirstHalf, SecondHalf, Reason) 
      VALUES ('${empID}', '${name}', '${fromDate}', '${toDate}', '${totalLeave}', 
      '${fullDay}', '${firstHalf}', '${secondHalf}', '${reason}');`;
      db.connect(config, function (error) {
        if (error)
          console.log(error);
        var request = new db.Request();
        request.query(leaveQuery, (error, result) => {
          if (error) {
            return res.status(404).json({ status: 'Not Found', data: error, message: "Error in inserting data" })
          } else {
            return res.status(200).json({ status: 'OK', data: result.recordset, message: "Leave request recorded successfully" })
          }
        });
      });
    } catch (error) {
      return res.status(500).json({ status: 'NOK', data: error, message: "Something went wrong. Please try again later" })
    }
  },
  fetchLeave: (req, res) => {
    const empname = req.query.empname;
    const startDate = req.query.startDate;
    const endDate = req.query.endDate;
    try {
      const fetchLeaveQuery = `select 
      ROW_NUMBER() OVER (ORDER BY fromDate) AS SNo, id,
      EmpID, EmpName, 
      FORMAT(FromDate, 'dd-MMM-yyyy') AS FromDate,
      FORMAT(ToDate, 'dd-MMM-yyyy') AS ToDate,
      NoOfLeave, FullDay, FirstHalf, SecondHalf, 
      Reason, Status, Remarks
      from LeaveRecord where EmpName = '${empname}'
      AND (
        (FromDate BETWEEN '${startDate}' AND '${endDate}')
        OR (ToDate BETWEEN '${startDate}' AND '${endDate}')
      );`;
      db.connect(config, function (error) {
        if (error) {
          console.log(error);
          return res.status(500).json({ status: 'NOK', data: error, message: 'Database connection error' });
        }
        var request = new db.Request();
        request.query(fetchLeaveQuery, (error, result) => {
          if (error) {
            return res.status(404).json({ status: 'Not Found', data: error, message: "Error fetching leave records" })
          }
          else {
            return res.status(200).json({ status: 'OK', data: result.recordset, message: "leave records displayed" });
          }
        });
      });
    } catch (error) {
      return res.status(500).json({ status: 'NOK', data: error, message: 'Internal server error' });
    }
  },
  pendingRecord: (req, res) => {
    const userType = parseInt(req.query.userType);
    const empid = req.query.empid;
    const page = parseInt(req.query.page || 1);
    const perPage = parseInt(req.query.perPage || 5);
    const startRow = (page - 1) * perPage + 1;
    const endRow = page * perPage;

    try {
      let pendingQuery = '';

      if (userType == 1) {
        pendingQuery = `select 
        ROW_NUMBER() OVER (ORDER BY fromDate desc) AS SNo, id,
      EmpID, EmpName, 
      FORMAT(fromDate, 'dd-MMM-yyyy') AS fromDate,
      FORMAT(toDate, 'dd-MMM-yyyy') AS toDate,
      NoOfLeave, FullDay, FirstHalf, SecondHalf, Reason, Remarks, Status
      from LeaveRecord`;
      } else if (userType == 2) {
        pendingQuery = `select 
        ROW_NUMBER() OVER (ORDER BY fromDate desc) AS SNo, id,
        EmpID, EmpName, 
        FORMAT(fromDate, 'dd-MMM-yyyy') AS fromDate,
        FORMAT(toDate, 'dd-MMM-yyyy') AS toDate,
        NoOfLeave, FirstHalf, SecondHalf, Reason, Status, Remarks
        from LeaveRecord where EmpID = '${empid}';`;
      }

      db.connect(config, function (error) {
        if (error) {
          console.log(error);
          return res.status(500).json({ status: 'NOK', data: error, message: 'Database connection error' });
        }
        var request = new db.Request();
        request.query(pendingQuery, (error, result) => {
          if (error) {
            return res.status(404).json({ status: 'Not Found', data: error, message: "Error fetching pending records" })
          }
          else {
            return res.status(200).json({ status: 'OK', data: result.recordset, message: "Pending records displayed" });
          }
        });
      });
    } catch (error) {
      return res.status(500).json({ status: 'NOK', data: error, message: 'Internal server error' });
    }
  },
  eachEmpLeaves: (req, res) => {
    const empid = req.query.empid;

    try {
      let eachEmpLeavesQuery = `select 
        ROW_NUMBER() OVER (ORDER BY fromDate desc) AS SNo, id,
      EmpID, EmpName, 
      FORMAT(fromDate, 'dd-MMM-yyyy') AS fromDate,
      FORMAT(toDate, 'dd-MMM-yyyy') AS toDate,
      NoOfLeave, FullDay, FirstHalf, SecondHalf, Reason, Remarks, Status
      from LeaveRecord where EmpID = '${empid}'`;
      db.connect(config, function (error) {
        if (error) {
          console.log(error);
          return res.status(500).json({ status: 'NOK', data: error, message: 'Database connection error' });
        }
        var request = new db.Request();
        request.query(eachEmpLeavesQuery, (error, result) => {
          if (error) {
            return res.status(404).json({ status: 'Not Found', data: error, message: "Error fetching each employee record" })
          }
          else {
            return res.status(200).json({ status: 'OK', data: result.recordset, message: "Each employee records displayed" });
          }
        });
      });
    } catch (error) {
      return res.status(500).json({ status: 'NOK', data: error, message: 'Internal server error' });
    }
  },
  updateApprove: (req, res) => {
    const Id = req.body.Id;
    const Reason = req.body.Reason;
    try {
      const approveQuery = `UPDATE LeaveRecord
      set Status = 'Approved', Remarks = '${Reason}'
      where id = '${Id}';`;
      db.connect(config, function (error) {
        if (error) {
          console.log(error);
          return res.status(500).json({ status: 'NOK', data: error, message: 'Database connection error' });
        }
        var request = new db.Request();
        request.query(approveQuery, (error, result) => {
          if (error) {
            return res.status(404).json({ status: 'Not Found', data: error, message: "Error updating approved status" })
          }
          else {
            return res.status(200).json({ status: 'OK', data: result.recordset, message: "Approved status updated" });
          }
        });
      });
    } catch (error) {
      return res.status(500).json({ status: 'NOK', data: error, message: 'Internal server error' });
    }
  },
  updateReject: (req, res) => {
    const rejectedCancel = req.body.rejectedCancel;
    const Id = req.body.Id;
    const rejectReason = req.body.rejectReason;
    try {
      const rejectQuery = `UPDATE LeaveRecord
      set Status = '${rejectedCancel}', Remarks = '${rejectReason}'
      where id = '${Id}'`;
      db.connect(config, function (error) {
        if (error) {
          console.log(error);
          return res.status(500).json({ status: 'NOK', data: error, message: 'Database connection error' });
        }
        var request = new db.Request();
        request.query(rejectQuery, (error, result) => {
          if (error) {
            return res.status(404).json({ status: 'Not Found', data: error, message: "Error updating rejected status" })
          }
          else {
            return res.status(200).json({ status: 'OK', data: result.recordset, message: "Rejected status updated" });
          }
        });
      });
    } catch (error) {
      return res.status(500).json({ status: 'NOK', data: error, message: 'Internal server error' });
    }
  },
  addLeave: (req, res) => {
    const EmpID = req.body.EmpID.trim();
    const fromDate = req.body.fromDate.trim();
    const toDate = req.body.toDate.trim();
    const empName = req.body.empName.trim();
    const reason = req.body.reason.trim();
    const status = req.body.status.trim();
    const remark = req.body.remark.trim();
    const NoOfLeave = req.body.NoOfLeave;
    const secondHalf1 = req.body.secondHalf ? req.body.secondHalf.trim() : '';
    const firstHalf1 = req.body.firstHalf ? req.body.firstHalf.trim() : '';

    // Check if the values are undefined or null
    if (secondHalf1 === undefined || secondHalf1 === null) {
      return res.status(200).json({ status: 'NOK', message: "Error adding rejected status" })
    }

    if (firstHalf1 === undefined || firstHalf1 === null) {
      return res.status(200).json({ status: 'NOK', message: "Error adding rejected status" })
    }

    try {
      let secondHalf = 0;
      if (secondHalf1 == 'Yes') {
        secondHalf = 1;
      }
      else {
        secondHalf = 0;
      }
      let firstHalf = 0;
      if (firstHalf1 == 'Yes') {
        firstHalf = 1;
      }
      else {
        firstHalf = 0;
      }

      const addleaveQuery = `INSERT INTO [dbo].[LeaveRecord]
      ([EmpID]
      ,[EmpName]
      ,[FromDate]
      ,[ToDate]
      ,[NoOfLeave]
      ,[FullDay]
      ,[FirstHalf]
      ,[SecondHalf]
      ,[Reason]
      ,[Status]
      ,[Remarks]) 
      VALUES
      ('${EmpID}'
      ,'${empName}'
      ,'${fromDate}'
      ,'${toDate}'
      ,'${NoOfLeave}'
      ,'0'
      ,'${firstHalf}'
      ,'${secondHalf}'
      ,'${reason}'
      ,'${status}'
      ,'${remark}')`;
      db.connect(config, function (error) {
        if (error) {
          console.log(error);
          return res.status(500).json({ status: 'NOK', data: error, message: 'Database connection error' });
        }
        var request = new db.Request();
        request.query(addleaveQuery, (error, result) => {
          if (error) {
            return res.status(404).json({ status: 'NOK', data: error, message: "Error adding leave request" })
          }
          else {
            return res.status(200).json({ status: 'OK', data: result.recordset, message: "Leave Added" });
          }
        });
      });
    } catch (error) {
      return res.status(500).json({ status: 'NOK', data: error, message: 'Internal server error' });
    }
  },
  LateCount: (req, res) => {
    const empID = req.query.empID;
    const fromDate = req.query.fromDate;
    const toDate = req.query.toDate;
    const relaxationTime = req.query.relaxationTime;

    try {
      const lateCountQuery = `SELECT COUNT(logintime) AS DaysWithLateLogin
      FROM (
          SELECT MIN(logintime) AS logintime
          FROM LoginRecord
          WHERE empid = '${empID}'
            AND CAST(logintime AS DATE) BETWEEN '${fromDate}' AND '${toDate}'
          GROUP BY CAST(logintime AS DATE)
      ) AS DailyLogins
      WHERE CAST(logintime AS TIME) > DATEADD(MINUTE, ${relaxationTime}, CONVERT(TIME, '09:00:59'))
      `;
      db.connect(config, function (error) {
        if (error) {
          console.log(error);
          return res.status(500).json({ status: 'NOK', data: error, message: 'Database connection error' });
        }
        var request = new db.Request();
        request.query(lateCountQuery, (error, result) => {
          if (error) {
            return res.status(404).json({ status: 'NOK', data: error, message: "Error counting late records" })
          }
          else {
            return res.status(200).json({ status: 'OK', data: result.recordset, message: "Late records counted successfully" });
          }
        });
      });
    } catch (error) {
      return res.status(500).json({ status: 'NOK', data: error, message: 'Internal server error' });
    }
  },
  displayEmpId: (req, res) => {
    const name = req.query.name;
    try {
      const idQuery = `SELECT empid FROM Users WHERE name = '${name}';`;
      db.connect(config, function (error) {
        if (error) {
          console.log(error);
          return res.status(500).json({ status: 'NOK', data: error, message: 'Database connection error' });
        }
        var request = new db.Request();
        request.query(idQuery, (error, result) => {
          if (error) {
            return res.status(404).json({ status: 'Not Found', data: error, message: "Error fetching employee id" })
          }
          else {
            const recordID = result.recordset[0].empid;
            return res.status(200).json({ status: 'OK', data: recordID, message: "Employee ID displayed" });
          }
        });
      });
    } catch (error) {
      return res.status(500).json({ status: 'NOK', data: error, message: 'Internal server error' });
    }
  },
  monthlyRecord: (req, res) => {
    const username = req.query.username;
    const month = req.query.month;
    const year = req.query.year;
    try {
      const monthQuery = `DECLARE @month INT = ${month}; 
      DECLARE @year INT = ${year}; 
      DECLARE @startDate DATETIME, @endDate DATETIME;
      
      SET @startDate = DATEADD(MONTH, @month - 1, DATEADD(YEAR, @year - 1900, 0));
      SET @endDate = CASE 
          WHEN @month = MONTH(GETDATE()) AND @year = YEAR(GETDATE()) THEN (GETDATE()-1)
          ELSE DATEADD(DAY, -1, DATEADD(MONTH, DATEDIFF(MONTH, 0, @startDate) + 1, 0))
      END;
      
      WITH DateRange AS (
          SELECT @startDate AS Date
          UNION ALL
          SELECT DATEADD(DAY, 1, Date)
          FROM DateRange
          WHERE Date < @endDate
      )
      
      SELECT 
          ROW_NUMBER() OVER (ORDER BY dr.Date) AS SNo,
          FORMAT(dr.Date, 'dd-MMM-yyyy') AS Date,
          DATENAME(WEEKDAY, Date) AS DayOfWeek,
          FORMAT(MIN(lr.logintime), 'hh:mm tt') AS LoginTime,
          FORMAT(MAX(lr.logoutTime), 'hh:mm tt') AS LogoutTime
      FROM DateRange dr
      LEFT JOIN
      LoginRecord lr ON FORMAT(lr.logintime, 'dd-MMM-yyyy') = FORMAT(dr.Date, 'dd-MMM-yyyy')
        AND lr.username = '${username}'
        GROUP BY dr.Date
      OPTION (MAXRECURSION 0); 
      `;
      db.connect(config, function (error) {
        if (error) {
          console.log(error);
          return res.status(500).json({ status: 'NOK', data: error, message: 'Database connection error' });
        }
        var request = new db.Request();
        request.query(monthQuery, (error, result) => {
          if (error) {
            return res.status(404).json({ status: 'Not Found', data: error, message: "Error fetching monthly report" })
          }
          else {
            const monthRecord = result.recordset.map(record => ({
              sno: record.SNo,
              date: record.Date,
              day: record.DayOfWeek,
              time: record.LoginTime,
              out: record.LogoutTime
            }));
            return res.status(200).json({ status: 'OK', data: monthRecord, message: "monthly report displayed" });
          }
        });
      });
    } catch (error) {
      return res.status(500).json({ status: 'NOK', data: error, message: 'Internal server error' });
    }
  },
  checkAllAbsent: (req, res) => {
    const date = req.query.date;
    try {
      let absentQuery = `SELECT CASE WHEN COUNT(*) = 0 THEN 1 ELSE 0 END AS allAbsent
      FROM LoginRecord
      WHERE CAST(logintime AS DATE) = '${date}' AND logintime IS NOT NULL`;

      db.connect(config, function (error) {
        if (error) {
          console.log(error);
          return res.status(500).json({ status: 'NOK', data: error, message: 'Database connection error' });
        }
        var request = new db.Request();
        request.query(absentQuery, (error, result) => {
          if (error) {
            return res.status(404).json({ status: 'Not Found', data: error, message: "error in checking all absent" })
          } else {
            const allAbsent = result.recordset[0].allAbsent === 1;
            return res.status(200).json({ status: 'OK', data: allAbsent, message: "all absent checked successfully" })
          }
        });
      });
    } catch (error) {
      return res.status(500).json({ status: 'NOK', data: error, message: 'Internal server error' });
    }
  },
  employeeName: (req, res) => {
    try {
      const empNameQuery = `SELECT name FROM Users;`;
      db.connect(config, function (error) {
        if (error) {
          console.log(error);
          return res.status(500).json({ status: 'NOK', data: error, message: 'Database connection error' });
        }
        var request = new db.Request();
        request.query(empNameQuery, (error, result) => {
          if (error) {
            return res.status(404).json({ status: 'Not Found', data: error, message: "Error fetching employee names" })
          }
          else {
            return res.status(200).json({ status: 'OK', data: result.recordset, message: "Employee names displayed" });
          }
        });
      });
    } catch (error) {
      return res.status(500).json({ status: 'NOK', data: error, message: 'Internal server error' });
    }
  },
  empIdName: (req, res) => {
    try {
      const empIdNameQuery = `SELECT empid, name FROM Users;`;
      db.connect(config, function (error) {
        if (error) {
          console.log(error);
          return res.status(500).json({ status: 'NOK', data: error, message: 'Database connection error' });
        }
        var request = new db.Request();
        request.query(empIdNameQuery, (error, result) => {
          if (error) {
            return res.status(404).json({ status: 'Not Found', data: error, message: "Error fetching employee name-ids" })
          }
          else {
            return res.status(200).json({ status: 'OK', data: result.recordset, message: "Employee name-ids displayed" });
          }
        });
      });
    } catch (error) {
      return res.status(500).json({ status: 'NOK', data: error, message: 'Internal server error' });
    }
  },
  employeeRecord: (req, res) => {
    const month = req.query.month;
    const year = req.query.year;
    try {
      const employeeQuery = `DECLARE @month int, @year int, @lastDay int
      set @month = '${month}'
      set @year =  '${year}'

      -- calculations
      DECLARE @startDate datetime, @endDate datetime
      SET @startDate = convert(varchar, @year) + '-' + convert(varchar, @month) + '-1'
      set @endDate = CASE WHEN @month = MONTH(GETDATE())
          THEN GETDATE()
          ELSE DATEADD(s,-1,DATEADD(mm, DATEDIFF(m,0,@startDate)+1,0))
          END
      set @lastDay =  day(@endDate) --last day of month

      declare @day int
      set @day = @lastDay

      declare @days varchar(max)
      declare @CurrentDate datetime  
      set @days = '[' + CONVERT(varchar(10), @endDate, 23) + ' (' + DATENAME(weekday, @endDate) + ')]';
      set @CurrentDate=@endDate;
      WHILE (@day > 1)
      BEGIN
          set @CurrentDate=DATEADD(d,-1,@CurrentDate );
          set @days = @days + ',['+CONVERT(varchar(10),@CurrentDate,23) +' ('+DATENAME(weekday,@CurrentDate)+')]'
          set @day = @day - 1
      END
    declare @query varchar(max)
      set @query = 'SELECT *
      FROM
      (
        SELECT 
        fullName AS EmployeeName,
        CONVERT(varchar(10), logintime,23) +'' (''+ DATENAME(weekday,logintime)+'')'' as AttendanceDate,
        CONVERT(VARCHAR(32),MIN(CAST(logintime AS TIME)), 100) AS AttendanceTime
        FROM LoginRecord
          WHERE MONTH(logintime) = ' + CONVERT(VARCHAR,@month) + '
          AND YEAR(logintime) = ' + CONVERT(VARCHAR,@year) + '
        GROUP BY fullName, CONVERT(varchar(10), logintime,23) +'' (''+ DATENAME(weekday,logintime)+'')''
      )SRC
      PIVOT
      (
        MAX(AttendanceTime)
        FOR ATTENDANCEDATE IN ('+@days+')
      )AS PVT'
  exec(@query); 
      `;
      db.connect(config, function (error) {
        if (error) {
          console.log(error);
          return res.status(500).json({ status: 'NOK', data: error, message: 'Database connection error' });
        }
        var request = new db.Request();
        request.query(employeeQuery, (error, result) => {
          if (error) {
            return res.status(404).json({ status: 'Not Found', data: error, message: "Error fetching employee report" })
          }
          else {
            return res.status(200).json({ status: 'OK', data: result.recordset, message: "employee report displayed" });
          }
        });
      });
    } catch (error) {
      return res.status(500).json({ status: 'NOK', data: error, message: 'Internal server error' });
    }
  },
  singleEmployee: (req, res) => {
    const month = req.query.month;
    const year = req.query.year;
    const empid = req.query.empid;
    try {
      const employeeQuery = `DECLARE @month int, @year int, @lastDay int, @empid varchar(100)
      set @month = '${month}'
      set @year =  '${year}'
      set @empid =  '${empid}'

      -- calculations
      DECLARE @startDate datetime, @endDate datetime
      SET @startDate = convert(varchar, @year) + '-' + convert(varchar, @month) + '-1'
      set @endDate = CASE WHEN @month = MONTH(GETDATE())
          THEN GETDATE()
          ELSE DATEADD(s,-1,DATEADD(mm, DATEDIFF(m,0,@startDate)+1,0))
          END
      set @lastDay =  day(@endDate) --last day of month

      declare @day int
      set @day = @lastDay

      declare @days varchar(max)
      declare @CurrentDate datetime  
      set @days = '[' + CONVERT(varchar(10), @endDate, 23) + ' (' + DATENAME(weekday, @endDate) + ')]';
      set @CurrentDate=@endDate;
      WHILE (@day > 1)
      BEGIN
          set @CurrentDate=DATEADD(d,-1,@CurrentDate );
          set @days = @days + ',['+CONVERT(varchar(10),@CurrentDate,23) +' ('+DATENAME(weekday,@CurrentDate)+')]'
          set @day = @day - 1
      END
    declare @query varchar(max)
      set @query = 'SELECT *
      FROM
      (
        SELECT 
        fullName AS EmployeeName,
        CONVERT(varchar(10), logintime,23) +'' (''+ DATENAME(weekday,logintime)+'')'' as AttendanceDate,
        CONVERT(VARCHAR(32),MIN(CAST(logintime AS TIME)), 100) AS AttendanceTime
        FROM LoginRecord
          WHERE MONTH(logintime) = ' + CONVERT(VARCHAR,@month) + '
          AND YEAR(logintime) = ' + CONVERT(VARCHAR,@year) + '
          AND empid = ''' + @empid + '''
          GROUP BY fullName, CONVERT(varchar(10), logintime,23) +'' (''+ DATENAME(weekday,logintime)+'')''
      )SRC
      PIVOT
      (
        MAX(AttendanceTime)
        FOR ATTENDANCEDATE IN ('+@days+')
      )AS PVT'
  exec(@query); 
      `;
      db.connect(config, function (error) {
        if (error) {
          console.log(error);
          return res.status(500).json({ status: 'NOK', data: error, message: 'Database connection error' });
        }
        var request = new db.Request();
        request.query(employeeQuery, (error, result) => {
          if (error) {
            return res.status(404).json({ status: 'Not Found', data: error, message: "Error fetching single employee report" })
          }
          else {
            return res.status(200).json({ status: 'OK', data: result.recordset, message: "single employee report displayed" });
          }
        });
      });
    } catch (error) {
      return res.status(500).json({ status: 'NOK', data: error, message: 'Internal server error' });
    }
  },
  leavesUsed: (req, res) => {
    const empid = req.query.empid;
    try {
      const leavesUsedQuery = `Select SUM(NoOfLeave) AS Leaves 
      from LeaveRecord
      where Status = 'Approved' and EmpID='${empid}'
      and YEAR(FromDate) = YEAR(GETDATE())`;
      db.connect(config, function (error) {
        if (error) {
          console.log(error);
          return res.status(500).json({ status: 'NOK', data: error, message: 'Database connection error' });
        }
        var request = new db.Request();
        request.query(leavesUsedQuery, (error, result) => {
          if (error) {
            return res.status(404).json({ status: 'Not Found', data: error, message: "Error fetching leaves used" })
          }
          else {
            return res.status(200).json({ status: 'OK', data: result.recordset, message: "leaves used displayed" });
          }
        });
      });
    } catch (error) {
      return res.status(500).json({ status: 'NOK', data: error, message: 'Internal server error' });
    }
  },
  empLeaves: (req, res) => {
    try {
      const empLeavesQuery = `SELECT 
	    u.empid AS EmpID,
      u.name AS EmpName, 
      ISNULL(SUM(lr.NoOfLeave),0) AS LeavesUsed
      FROM Users u 
      LEFT JOIN 
        (
          SELECT * FROM LeaveRecord lr WHERE
          lr.Status = 'Approved' 
          and YEAR(lr.FromDate) = YEAR(GETDATE())
        )lr 
          ON u.empid = lr.EmpID
          WHERE u.isStatus = 1 AND u.empid NOT IN ('ML01', 'ML02', 'ML35')
          GROUP BY u.empid, u.name
          ORDER BY u.empid;`;
      db.connect(config, function (error) {
        if (error) {
          console.log(error);
          return res.status(500).json({ status: 'NOK', data: error, message: 'Database connection error' });
        }
        var request = new db.Request();
        request.query(empLeavesQuery, (error, result) => {
          if (error) {
            return res.status(404).json({ status: 'Not Found', data: error, message: "Error fetching leave count" })
          }
          else {
            return res.status(200).json({ status: 'OK', data: result.recordset, message: "leave count displayed" });
          }
        });
      });
    } catch (error) {
      return res.status(500).json({ status: 'NOK', data: error, message: 'Internal server error' });
    }
  },
  monthwiseLeaves: (req, res) => {
    const month = req.query.month;
    const year = req.query.year;
    try {
      const monthwiseLeavesQuery = `
      DECLARE @Month INT = ${month};
      DECLARE @Year INT = ${year};

      WITH LeaveDays AS (
          SELECT
              EmpID,
              CASE
                  WHEN MONTH(FromDate) = @Month AND YEAR(FromDate) = @Year THEN FromDate
                  WHEN MONTH(FromDate) < @Month AND MONTH(ToDate) >= @Month AND YEAR(ToDate) = @Year THEN DATEFROMPARTS(@Year, @Month, 1)
                  ELSE NULL
              END AS MonthStartDate,
              CASE
                  WHEN MONTH(ToDate) = @Month AND YEAR(ToDate) = @Year THEN ToDate
                  WHEN MONTH(ToDate) > @Month AND MONTH(FromDate) <= @Month AND YEAR(FromDate) = @Year THEN EOMONTH(DATEFROMPARTS(@Year, @Month, 1))
                  ELSE NULL
              END AS MonthEndDate,
              ISNULL(FirstHalf, 0) AS FirstHalf,
              ISNULL(SecondHalf, 0) AS SecondHalf
          FROM LeaveRecord
          WHERE
              status = 'Approved' AND 
        (
              (MONTH(FromDate) = @Month AND YEAR(FromDate) = @Year) OR
              (MONTH(ToDate) = @Month AND YEAR(ToDate) = @Year) OR
              (MONTH(FromDate) < @Month AND MONTH(ToDate) > @Month AND YEAR(ToDate) = @Year) 
        )
      ),
      AggregatedLeave AS (
          SELECT
              EmpID,
              SUM(DATEDIFF(day, MonthStartDate, MonthEndDate) + 1) - SUM((ISNULL(FirstHalf, 0) + ISNULL(SecondHalf, 0)) / 2.0) AS NoOfLeave
          FROM LeaveDays
          WHERE MonthStartDate IS NOT NULL AND MonthEndDate IS NOT NULL
          GROUP BY EmpID
      )

      SELECT
          u.EmpID,
          u.name AS EmpName,
          FORMAT(ISNULL(al.NoOfLeave, 0), 'N1') AS LeavesUsed
      FROM Users u
      LEFT JOIN AggregatedLeave al ON u.EmpID = al.EmpID
      WHERE u.isStatus = 1 AND u.empid NOT IN ('ML01', 'ML02', 'ML35')
      ORDER BY u.EmpID;`;
      db.connect(config, function (error) {
        if (error) {
          console.log(error);
          return res.status(500).json({ status: 'NOK', data: error, message: 'Database connection error' });
        }
        var request = new db.Request();
        request.query(monthwiseLeavesQuery, (error, result) => {
          if (error) {
            return res.status(404).json({ status: 'Not Found', data: error, message: "Error fetching leave count" })
          }
          else {
            return res.status(200).json({ status: 'OK', data: result.recordset, message: "leave count displayed" });
          }
        });
      });
    } catch (error) {
      return res.status(500).json({ status: 'NOK', data: error, message: 'Internal server error' });
    }
  },
  futureLeaves: (req, res) => {
    const empid = req.query.empid;
    try {
      const futureLeavesQuery = `SELECT 
        FORMAT(FromDate, 'dd-MMMM-yyyy') AS FromDate,
        FORMAT(ToDate, 'dd-MMMM-yyyy') AS ToDate,
        NoOfLeave as Days, Status 
      FROM LeaveRecord
        WHERE CAST(GETDATE() AS DATE) BETWEEN FromDate AND ToDate
        and EmpID='${empid}'
        ORDER BY CAST(FromDate AS DATE) ASC`;
      db.connect(config, function (error) {
        if (error) {
          console.log(error);
          return res.status(500).json({ status: 'NOK', data: error, message: 'Database connection error' });
        }
        var request = new db.Request();
        request.query(futureLeavesQuery, (error, result) => {
          if (error) {
            return res.status(404).json({ status: 'Not Found', data: error, message: "Error fetching future leaves" })
          }
          else {
            return res.status(200).json({ status: 'OK', data: result.recordset, message: "future leaves displayed" });
          }
        });
      });
    } catch (error) {
      return res.status(500).json({ status: 'NOK', data: error, message: 'Internal server error' });
    }
  },
  onLeave: (req, res) => {
    const empid = req.query.empid;
    try {
      const onLeaveQuery = `Select EmpID, EmpName 
      from LeaveRecord 
      where  Status = 'Approved' AND
      CAST(GETDATE() AS DATE) BETWEEN FromDate AND ToDate;`;
      db.connect(config, function (error) {
        if (error) {
          console.log(error);
          return res.status(500).json({ status: 'NOK', data: error, message: 'Database connection error' });
        }
        var request = new db.Request();
        request.query(onLeaveQuery, (error, result) => {
          if (error) {
            return res.status(404).json({ status: 'Not Found', data: error, message: "Error fetching today's absentees" })
          }
          else {
            return res.status(200).json({ status: 'OK', data: result.recordset, message: "todays absentees displayed" });
          }
        });
      });
    } catch (error) {
      return res.status(500).json({ status: 'NOK', data: error, message: 'Internal server error' });
    }
  },
  Birthday: (req, res) => {
    try {
      const birthdayQuery = `
      DECLARE @Today DATE = CAST(GETDATE() AS DATE);
DECLARE @EndDate DATE = DATEADD(DAY, 30, @Today);

SELECT
    name,
    FORMAT(
      CASE
          WHEN DATEADD(YEAR, DATEDIFF(YEAR, birthday, @Today), birthday) BETWEEN @Today AND @EndDate
          THEN DATEADD(YEAR, DATEDIFF(YEAR, birthday, @Today), birthday)
          ELSE DATEADD(YEAR, DATEDIFF(YEAR, birthday, @Today) + 1, birthday)
      END, 'dd-MMM-yyyy') AS UpcomingBirthday
FROM
    Users
WHERE 
    isStatus = 1 
    AND (
        DATEADD(YEAR, DATEDIFF(YEAR, birthday, @Today), birthday) BETWEEN @Today AND @EndDate
        OR DATEADD(YEAR, DATEDIFF(YEAR, birthday, @Today) + 1, birthday) BETWEEN @Today AND @EndDate
    )
ORDER BY
    CASE
        WHEN DATEADD(YEAR, DATEDIFF(YEAR, birthday, @Today), birthday) BETWEEN @Today AND @EndDate
        THEN DATEADD(YEAR, DATEDIFF(YEAR, birthday, @Today), birthday)
        ELSE DATEADD(YEAR, DATEDIFF(YEAR, birthday, @Today) + 1, birthday)
    END;
      `;
      db.connect(config, function (error) {
        if (error) {
          console.log(error);
          return res.status(500).json({ status: 'NOK', data: error, message: 'Database connection error' });
        }
        var request = new db.Request();
        request.query(birthdayQuery, (error, result) => {
          if (error) {
            return res.status(404).json({ status: 'Not Found', data: error, message: "Error fetching upcoming birthdays" })
          }
          else {
            return res.status(200).json({ status: 'OK', data: result.recordset, message: "upcoming birthdays displayed" });
          }
        });
      });
    } catch (error) {
      return res.status(500).json({ status: 'NOK', data: error, message: 'Internal server error' });
    }
  },
  countDays: (req, res) => {
    const empid = req.query.empid;
    try {
      const countQuery = `-- Calculate total days in the current month
      DECLARE @TotalDaysInMonth INT = DAY(GETDATE());
      
      -- Calculate the number of distinct working days (days with login records) in the current month
      DECLARE @WorkingDays INT = (
          SELECT COUNT(DISTINCT CAST(logintime AS DATE))
          FROM LoginRecord
          WHERE FORMAT(logintime, 'yyyy-MM') = FORMAT(GETDATE(), 'yyyy-MM')
      );
      
      -- Calculate total off days (absent days) in the current month
      DECLARE @TotalOff INT = @TotalDaysInMonth - @WorkingDays;
      
      -- Display the results
      SELECT
          @TotalDaysInMonth AS TotalDays,
          @WorkingDays AS WorkingDays,
          @TotalOff AS TotalOff,
          @WorkingDays-(Present) AS Absent,
          Present,
        Late
      FROM (
          SELECT
              COUNT(logintime) AS Present,
              SUM( CASE WHEN FORMAT(logintime ,'hh:mm') > '09:00' THEN 1 ELSE 0 END   ) AS Late
          FROM(
            SELECT MIN(logintime) logintime
            FROM LoginRecord
            WHERE FORMAT(logintime, 'yyyy-MM') = FORMAT(GETDATE(), 'yyyy-MM')
              AND empid = '${empid}'
              GROUP BY CAST(LOGINTIME AS DATE)
          )IT
      ) AS T;`;
      db.connect(config, function (error) {
        if (error) {
          console.log(error);
          return res.status(500).json({ status: 'NOK', data: error, message: 'Database connection error' });
        }
        var request = new db.Request();
        request.query(countQuery, (error, result) => {
          if (error) {
            return res.status(404).json({ status: 'Not Found', data: error, message: "Error fetching counts" })
          }
          else {
            return res.status(200).json({ status: 'OK', data: result.recordset, message: "todays counts displayed" });
          }
        });
      });
    } catch (error) {
      return res.status(500).json({ status: 'NOK', data: error, message: 'Internal server error' });
    }
  },
  Monthwise: (req, res) => {
    const viewdate = req.query.viewdate;
    const empid = req.query.empid;
    try {
      const countQuery = `-- Calculate total days in the current month
      DECLARE @TotalDaysInMonth INT = 30;
	  DECLARE @CurrentMonthStart DATE = '${viewdate}';
      
      -- Calculate the number of distinct working days (days with login records) in the current month
      DECLARE @WorkingDays INT = (
          SELECT COUNT(DISTINCT CAST(logintime AS DATE))
          FROM LoginRecord
          WHERE FORMAT(logintime, 'yyyy-MM') = FORMAT(@CurrentMonthStart, 'yyyy-MM')
      );
      
      -- Calculate total off days (absent days) in the current month
      DECLARE @TotalOff INT = @TotalDaysInMonth - @WorkingDays;
      
      -- Display the results
      SELECT
          @TotalDaysInMonth AS TotalDays,
          @WorkingDays AS WorkingDays,
          @TotalOff AS TotalOff,
          @WorkingDays-(Present) AS Absent,
          Present,
          COALESCE(Late, 0) AS Late
      FROM (
          SELECT
              COUNT(logintime) AS Present,
              SUM( CASE WHEN FORMAT(logintime ,'hh:mm') > '09:00' THEN 1 ELSE 0 END   ) AS Late
          FROM(
            SELECT MIN(logintime) logintime
            FROM LoginRecord
            WHERE FORMAT(logintime, 'yyyy-MM') = FORMAT(@CurrentMonthStart, 'yyyy-MM')
              AND empid = '${empid}'
              GROUP BY CAST(LOGINTIME AS DATE)
          )IT
      ) AS T;`;
      db.connect(config, function (error) {
        if (error) {
          console.log(error);
          return res.status(500).json({ status: 'NOK', data: error, message: 'Database connection error' });
        }
        var request = new db.Request();
        request.query(countQuery, (error, result) => {
          if (error) {
            return res.status(404).json({ status: 'Not Found', data: error, message: "Error fetching counts" })
          }
          else {
            return res.status(200).json({ status: 'OK', data: result.recordset, message: "todays counts displayed" });
          }
        });
      });
    } catch (error) {
      return res.status(500).json({ status: 'NOK', data: error, message: 'Internal server error' });
    }
  },
  leaveCounts: (req, res) => {
    const empid = req.query.empid;
    try {
      const leaveCountsQuery = `select Status, count(Status) AS Count
      from LeaveRecord 
      where EmpID = '${empid}'
      group by  Status;`;
      db.connect(config, function (error) {
        if (error) {
          console.log(error);
          return res.status(500).json({ status: 'NOK', data: error, message: 'Database connection error' });
        }
        var request = new db.Request();
        request.query(leaveCountsQuery, (error, result) => {
          if (error) {
            return res.status(404).json({ status: 'Not Found', data: error, message: "Error fetching leave counts" })
          }
          else {
            return res.status(200).json({ status: 'OK', data: result.recordset, message: "todays leave count displayed" });
          }
        });
      });
    } catch (error) {
      return res.status(500).json({ status: 'NOK', data: error, message: 'Internal server error' });
    }
  },
  workingHours: (req, res) => {
    const date = req.query.date;
    try {
      const workingHoursQuery = `DECLARE @yesterday DATE = '${date}';
                                  SELECT 
                                    empid,
                                    fullName, 
                                    logintime, 
                                    logoutTime,
                                              ISNULL(RIGHT('0' + CAST((DATEDIFF(SECOND, [logintime], ISNULL([logouttime], [logintime])) / 3600) AS VARCHAR), 2),0) + ':' +
                                              ISNULL(RIGHT('0' + CAST((DATEDIFF(SECOND, [logintime], ISNULL([logouttime], [logintime])) % 3600) / 60 AS VARCHAR), 2),0) + ':' +
                                              ISNULL(RIGHT('0' + CAST(DATEDIFF(SECOND, [logintime], ISNULL([logouttime], [logintime])) % 60 AS VARCHAR), 2),0) AS workedFor
                                  FROM
                                      [MLIMDB].[dbo].[LoginRecord]
                                  WHERE
                                      CAST([logintime] AS DATE) = @yesterday;`;
      db.connect(config, function (error) {
        if (error) {
          console.log(error);
          return res.status(500).json({ status: 'NOK', data: error, message: 'Database connection error' });
        }
        var request = new db.Request();
        request.query(workingHoursQuery, (error, result) => {
          if (error) {
            return res.status(404).json({ status: 'Not Found', data: error, message: "Error fetching working hours" })
          }
          else {
            return res.status(200).json({ status: 'OK', data: result.recordset, message: "Working hours displayed" });
          }
        });
      });
    } catch (error) {
      return res.status(500).json({ status: 'NOK', data: error, message: 'Internal server error' });
    }
  },
  changePassword: async (req, res) => {
    const EmpID = req.body.EmpID;
    const Password = req.body.Password;
    try {
      const hashedPassword = await bcrypt.hash(Password, saltRounds);
      const passwordQuery = `UPDATE Users
      set password = '${hashedPassword}'
      where empid = '${EmpID}';`;
      db.connect(config, function (error) {
        if (error) {
          console.log(error);
          return res.status(500).json({ status: 'NOK', data: error, message: 'Database connection error' });
        }
        var request = new db.Request();
        request.query(passwordQuery, (error, result) => {
          if (error) {
            return res.status(404).json({ status: 'Not Found', data: error, message: "Error updating new password" })
          }
          else {
            return res.status(200).json({ status: 'OK', data: result.recordset, message: "New password updated" });
          }
        });
      });
    } catch (error) {
      return res.status(500).json({ status: 'NOK', data: error, message: 'Internal server error' });
    }
  },
  addOfficialDuty: (req, res) => {
    const EmpID = req.body.EmpID.trim();
    const fromDate = req.body.fromDate.trim().replace('T', ' ');
    const toDate = req.body.toDate.trim().replace('T', ' ');
    const empName = req.body.empName.trim();
    const reason = req.body.reason.trim();
    const status = req.body.status.trim();
    const Mode = req.body.Mode;
    const secondHalf1 = req.body.secondHalf ? 1 : '';
    const firstHalf1 = req.body.firstHalf ? 1 : '';

    // Check if the values are undefined or null
    if (secondHalf1 === undefined || secondHalf1 === null) {
      return res.status(200).json({ status: 'NOK', message: "Error adding rejected status" })
    }

    if (firstHalf1 === undefined || firstHalf1 === null) {
      return res.status(200).json({ status: 'NOK', message: "Error adding rejected status" })
    }

    try {
      const addOfficialDutyQuery = `INSERT INTO [dbo].[OfficialDuty]
      ([EmpID]
      ,[EmpName]
      ,[FromDate]
      ,[ToDate]
      ,[Mode]
      ,[FirstHalf]
      ,[SecondHalf]
      ,[Reason]
      ,[Status])
VALUES
      ('${EmpID}'
      ,'${empName}'
      ,'${fromDate.replace('T', ' ')}'
      ,'${toDate.replace('T', ' ')}'
      ,'${Mode}'
      ,'${firstHalf1}'
      ,'${secondHalf1}'
      ,'${reason}'
      ,'${status}')`;
      db.connect(config, function (error) {
        if (error) {
          console.log(error);
          return res.status(500).json({ status: 'NOK', data: error, message: 'Database connection error' });
        }
        var request = new db.Request();
        request.query(addOfficialDutyQuery, (error, result) => {
          if (error) {
            return res.status(404).json({ status: 'NOK', data: error, message: "Error adding Official Duty Task request" })
          }
          else {
            return res.status(200).json({ status: 'OK', data: result.recordset, message: "OD Added" });
          }
        });
      });
    } catch (error) {
      return res.status(500).json({ status: 'NOK', data: error, message: 'Internal server error' });
    }
  },
  pendingOfficialDuty: (req, res) => {
    const userType = parseInt(req.query.userType);
    const empid = req.query.empid;
    const page = parseInt(req.query.page || 1);
    const perPage = parseInt(req.query.perPage || 5);
    const startRow = (page - 1) * perPage + 1;
    const endRow = page * perPage;

    try {
      let pendingQuery = '';

      if (userType == 1) {
        pendingQuery = `select 
                        ROW_NUMBER() OVER (ORDER BY fromDate desc) AS SNo, id,
                        EmpID, EmpName, 
                        FORMAT(fromDate, 'dd-MMM-yyyy') AS fromDate,
                        FORMAT(toDate, 'dd-MMM-yyyy') AS toDate,
                        Mode, FirstHalf, SecondHalf, Reason, Status, Remarks
                        from [OfficialDuty]`;
      } else if (userType == 2) {
        pendingQuery = `select 
                        ROW_NUMBER() OVER (ORDER BY fromDate desc) AS SNo, id,
                        EmpID, EmpName, 
                        FORMAT(fromDate, 'dd-MMM-yyyy') AS fromDate,
                        FORMAT(toDate, 'dd-MMM-yyyy') AS toDate,
                        Mode, FirstHalf, SecondHalf, Reason, Status, Remarks
                        from [OfficialDuty] where EmpID = '${empid}';`;
      }

      db.connect(config, function (error) {
        if (error) {
          console.log(error);
          return res.status(500).json({ status: 'NOK', data: error, message: 'Database connection error' });
        }
        var request = new db.Request();
        request.query(pendingQuery, (error, result) => {
          if (error) {
            return res.status(404).json({ status: 'Not Found', data: error, message: "Error fetching pending records" })
          }
          else {
            return res.status(200).json({ status: 'OK', data: result.recordset, message: "Pending records displayed" });
          }
        });
      });
    } catch (error) {
      return res.status(500).json({ status: 'NOK', data: error, message: 'Internal server error' });
    }
  },
  eachEmpOfficialDuty: (req, res) => {
    const empid = req.query.empid;
    try {
      let eachEmpODQuery = `select 
                                ROW_NUMBER() OVER (ORDER BY fromDate desc) AS SNo, id,
                                EmpID, EmpName, 
                                FORMAT(fromDate, 'dd-MMM-yyyy') AS fromDate,
                                FORMAT(toDate, 'dd-MMM-yyyy') AS toDate,
                                Mode, FirstHalf, SecondHalf, Reason, Status
                                from [OfficialDuty] where EmpID = '${empid}'`;
      db.connect(config, function (error) {
        if (error) {
          console.log(error);
          return res.status(500).json({ status: 'NOK', data: error, message: 'Database connection error' });
        }
        var request = new db.Request();
        request.query(eachEmpODQuery, (error, result) => {
          if (error) {
            return res.status(404).json({ status: 'Not Found', data: error, message: "Error fetching employee OD records" })
          }
          else {
            return res.status(200).json({ status: 'OK', data: result.recordset, message: "Employee OD records displayed" });
          }
        });
      });
    } catch (error) {
      return res.status(500).json({ status: 'NOK', data: error, message: 'Internal server error' });
    }
  },
  updateApproveForOD: (req, res) => {
    const EmpID = req.body.EmpID;
    const Id = req.body.Id;
    const Reason = req.body.Reason;
    try {
      const approveQuery = `UPDATE OfficialDuty
      set Status = 'Approved', Remarks = '${Reason}'
      where id = '${Id}';`;
      db.connect(config, function (error) {
        if (error) {
          console.log(error);
          return res.status(500).json({ status: 'NOK', data: error, message: 'Database connection error' });
        }
        var request = new db.Request();
        request.query(approveQuery, (error, result) => {
          if (error) {
            return res.status(404).json({ status: 'Not Found', data: error, message: "Error updating approved status" })
          }
          else {
            return res.status(200).json({ status: 'OK', data: result.recordset, message: "Approved status updated" });
          }
        });
      });
    } catch (error) {
      return res.status(500).json({ status: 'NOK', data: error, message: 'Internal server error' });
    }
  },
  updatePullbackForOD: (req, res) => {
    const Id = req.body.Id;
    const rejectReason = req.body.rejectReason;
    try {
      const pullbackQuery = `UPDATE OfficialDuty
      set Status = 'Pullback', Remarks = '${rejectReason}'
      where id = '${Id}'`;
      db.connect(config, function (error) {
        if (error) {
          console.log(error);
          return res.status(500).json({ status: 'NOK', data: error, message: 'Database connection error' });
        }
        var request = new db.Request();
        request.query(pullbackQuery, (error, result) => {
          if (error) {
            return res.status(404).json({ status: 'Not Found', data: error, message: "Error updating pullback status" })
          }
          else {
            return res.status(200).json({ status: 'OK', data: result.recordset, message: "Pullback status updated" });
          }
        });
      });
    } catch (error) {
      return res.status(500).json({ status: 'NOK', data: error, message: 'Internal server error' });
    }
  },
  updateRejectForOD: (req, res) => {
    const Id = req.body.Id;
    const rejectReason = req.body.rejectReason;
    try {
      const rejectQuery = `UPDATE OfficialDuty
      set Status = 'Rejected', Remarks = '${rejectReason}'
      where ID = '${Id}'`;
      db.connect(config, function (error) {
        if (error) {
          console.log(error);
          return res.status(500).json({ status: 'NOK', data: error, message: 'Database connection error' });
        }
        var request = new db.Request();
        request.query(rejectQuery, (error, result) => {
          if (error) {
            return res.status(404).json({ status: 'Not Found', data: error, message: "Error updating rejected OD status" })
          }
          else {
            return res.status(200).json({ status: 'OK', data: result.recordset, message: "Rejected OD status updated" });
          }
        });
      });
    } catch (error) {
      return res.status(500).json({ status: 'NOK', data: error, message: 'Internal server error' });
    }
  },
  fetchOfficialDuty: (req, res) => {
    const empname = req.query.empname;
    const startDate = req.query.startDate;
    const endDate = req.query.endDate;
    try {
      const fetchOfficialDutyQuery = `  select 
      ROW_NUMBER() OVER (ORDER BY fromDate) AS SNo, id,
      Empid, EmpName, 
      FORMAT(FromDate, 'dd-MMM-yyyy') AS FromDate,
      FORMAT(ToDate, 'dd-MMM-yyyy') AS ToDate,
      Mode, FirstHalf, SecondHalf, 
      Reason, Status, Remarks
      from OfficialDuty where EmpName = '${empname}'
      AND (
        (FromDate BETWEEN '${startDate}' AND '${endDate}')
        OR (ToDate BETWEEN '${startDate}' AND '${endDate}')
      ) AND Status = 'Approved';`;
      db.connect(config, function (error) {
        if (error) {
          console.log(error);
          return res.status(500).json({ status: 'NOK', data: error, message: 'Database connection error' });
        }
        var request = new db.Request();
        request.query(fetchOfficialDutyQuery, (error, result) => {
          if (error) {
            return res.status(404).json({ status: 'Not Found', data: error, message: "Error fetching OD records" })
          }
          else {
            return res.status(200).json({ status: 'OK', data: result.recordset, message: "OD records displayed" });
          }
        });
      });
    } catch (error) {
      return res.status(500).json({ status: 'NOK', data: error, message: 'Internal server error' });
    }
  },
  monthlyWorkingHours: (req, res) => {
    const empid = req.query.empid;
    const month = req.query.month;
    const year = req.query.year;
    try {
      let monthlyWorkingHoursQuery = `
      DECLARE @year INT = ${year};
      DECLARE @month INT = ${month};
      DECLARE @empid NVARCHAR(50) = '${empid}';
      DECLARE @startOfMonth DATE = DATEFROMPARTS(@year, @month, 1);
      DECLARE @endOfMonth DATE = DATEADD(MONTH, 1, @startOfMonth);
      SELECT empid, fullName, FORMAT(logintime, 'yyyy-MM-dd') AS [WorkingDay],
      --SUM(DATEDIFF(SECOND, [logintime], ISNULL([logouttime], [logintime]))) AS TotalSecondsWorked,
      RIGHT('0' + CAST((SUM(DATEDIFF(SECOND, [logintime], ISNULL([logouttime], [logintime]))) / 3600) AS VARCHAR), 2) + ':' +
      RIGHT('0' + CAST((SUM(DATEDIFF(SECOND, [logintime], ISNULL([logouttime], [logintime]))) % 3600 / 60) AS VARCHAR), 2) + ':' +
      RIGHT('0' + CAST(SUM(DATEDIFF(SECOND, [logintime], ISNULL([logouttime], [logintime]))) % 60 AS VARCHAR), 2) AS WorkedFor
      FROM [MLIMDB].[dbo].[LoginRecord]
      WHERE logintime >= @startOfMonth AND logintime < @endOfMonth AND empid = @empid
      GROUP BY empid, fullName, logintime 
      ORDER BY empid, [WorkingDay];`;
      db.connect(config, function (error) {
        if (error) {
          console.log(error);
          return res.status(500).json({ status: 'NOK', data: error, message: 'Database connection error' });
        }
        var request = new db.Request();
        request.query(monthlyWorkingHoursQuery, (error, result) => {
          if (error) {
            return res.status(404).json({ status: 'Not Found', data: error, message: "Error fetching monthly working hours" })
          }
          else {
            return res.status(200).json({ status: 'OK', data: result.recordset, message: "Monthly working hours displayed" });
          }
        });
      });
    } catch (error) {
      return res.status(500).json({ status: 'NOK', data: error, message: 'Internal server error' });
    }
  },
  insertWFHLogin: (req, res) => {
    const id = req.body.Id;
    try {
      const WFHLoginQuery = `
      DECLARE @startDate DATE;
      DECLARE @endDate DATE;
      DECLARE @empid NVARCHAR(50);
      DECLARE @username NVARCHAR(50);
      DECLARE @fullName NVARCHAR(100);

      SELECT @empid = od.empid, @username = u.username, @fullName = od.empName, @startDate = od.FromDate, @endDate = od.ToDate
      FROM OfficialDuty od
      JOIN Users u ON od.empid = u.empid
      WHERE od.ID = '${id}';

      IF @startDate IS NOT NULL AND @endDate IS NOT NULL
      BEGIN
          WHILE @startDate <= @endDate
          BEGIN
              INSERT INTO LoginRecord (username, logintime, fullName, logoutTime, empid)
              VALUES (
                  @username,
                  CAST(CONVERT(varchar, @startDate, 23) + ' 09:00:00' AS DATETIME),
                  @fullName,
                  CAST(CONVERT(varchar, @startDate, 23) + ' 17:30:00' AS DATETIME),
                  @empid
              );
              SET @startDate = DATEADD(DAY, 1, @startDate);
          END
      END`;
      db.connect(config, function (error) {
        if (error) {
          console.log(error);
          return res.status(500).json({ status: 'NOK', data: error, message: 'Database connection error' });
        }
        var request = new db.Request();
        request.query(WFHLoginQuery, (error, result) => {
          if (error) {
            return res.status(404).json({ status: 'NOK', data: error, message: "Error adding WFH Login" })
          }
          else {
            return res.status(200).json({ status: 'OK', data: result.recordset, message: "WFH Login Added" });
          }
        });
      });
    } catch (error) {
      return res.status(500).json({ status: 'NOK', data: error, message: 'Internal server error' });
    }
  },
  insertODLogin: (req, res) => {
    const id = req.body.Id;
    try {
      const ODLoginQuery = `
       DECLARE @startDate DATE;
       DECLARE @endDate DATE;
       DECLARE @empid NVARCHAR(50);
       DECLARE @username NVARCHAR(50);
       DECLARE @fullName NVARCHAR(100);
	     DECLARE @morning NVARCHAR(100);
	     DECLARE @evening NVARCHAR(100);

    SELECT 
    @empid = od.empid, 
    @username = u.username, 
    @fullName = od.empName, 
    @startDate = od.FromDate, 
    @endDate = od.ToDate,
    @morning = od.FirstHalf,
    @evening = od.SecondHalf
    FROM OfficialDuty od
    JOIN Users u ON od.empid = u.empid
    WHERE od.ID = '${id}';

    IF @startDate IS NOT NULL AND @endDate IS NOT NULL
    BEGIN
        WHILE @startDate <= @endDate
        BEGIN
            DECLARE @logintime DATETIME = CAST(CONVERT(varchar, @startDate, 23) + ' 09:00:00' AS DATETIME);
            DECLARE @logouttime DATETIME = CAST(CONVERT(varchar, @startDate, 23) + ' 17:30:00' AS DATETIME);
              
            -- Check if logintime already exists
            IF EXISTS (SELECT 1 FROM LoginRecord WHERE username = @username AND CONVERT(DATE, logintime) = @startDate)
            BEGIN
                --Update logintime to 9:00am
                IF @morning = '1' AND @evening = '0'
				BEGIN
                    UPDATE LoginRecord
                    SET logintime = @logintime
                    WHERE username = @username AND CONVERT(DATE, logintime) = @startDate;
                END
                ELSE IF @morning = '0' AND @evening = '1'
                BEGIN
                    -- Update logouttime to 5:30pm of logintime date
                    UPDATE LoginRecord
                    SET logoutTime = @logouttime
                    WHERE username = @username AND CONVERT(DATE, logintime) = @startDate;
                END
				ELSE IF @morning = '0' AND @evening = '0'
                BEGIN
                    -- Update logintime and logouttime for the date
                    UPDATE LoginRecord
                    SET logintime = @logintime, logoutTime = @logouttime
                    WHERE username = @username AND CONVERT(DATE, logintime) = @startDate;
                END
            END
            ELSE
            BEGIN
                -- Insert new record if logintime does not exist
                INSERT INTO LoginRecord (username, logintime, fullName, logoutTime, empid)
                VALUES (@username, @logintime, @fullName, @logouttime, @empid);
            END
              
            SET @startDate = DATEADD(DAY, 1, @startDate);
        END
    END`;
      db.connect(config, function (error) {
        if (error) {
          console.log(error);
          return res.status(500).json({ status: 'NOK', data: error, message: 'Database connection error' });
        }
        var request = new db.Request();
        request.query(ODLoginQuery, (error, result) => {
          if (error) {
            return res.status(404).json({ status: 'NOK', data: error, message: "Error adding OD Login" })
          }
          else {
            return res.status(200).json({ status: 'OK', data: result.recordset, message: "OD Login Added" });
          }
        });
      });
    } catch (error) {
      return res.status(500).json({ status: 'NOK', data: error, message: 'Internal server error' });
    }
  },
  addTroubleshoot: (req, res) => {
    const issueDate = req.body.issueDate.trim();
    const issue = req.body.Issue.trim();

    try {
      const addOfficialDutyQuery = `
      INSERT INTO Troubleshoot 
      (issueDate, Issue) 
      VALUES ('${issueDate}', '${issue}');`;
      db.connect(config, function (error) {
        if (error) {
          console.log(error);
          return res.status(500).json({ status: 'NOK', data: error, message: 'Database connection error' });
        }
        var request = new db.Request();
        request.query(addOfficialDutyQuery, (error, result) => {
          if (error) {
            return res.status(404).json({ status: 'NOK', data: error, message: "Error adding issue" })
          }
          else {
            return res.status(200).json({ status: 'OK', data: result.recordset, message: "Issue Added" });
          }
        });
      });
    } catch (error) {
      return res.status(500).json({ status: 'NOK', data: error, message: 'Internal server error' });
    }
  },
  fetchIssue: (req, res) => {
    try {
      const fetchOfficialDutyQuery = `
        SELECT 
	        ROW_NUMBER() Over (Order by issueDate DESC) As SNo,
	        FORMAT(issueDate, 'dd-MMM-yyyy') As issueDate,
	        Issue
        FROM Troubleshoot;`;
      db.connect(config, function (error) {
        if (error) {
          console.log(error);
          return res.status(500).json({ status: 'NOK', data: error, message: 'Database connection error' });
        }
        var request = new db.Request();
        request.query(fetchOfficialDutyQuery, (error, result) => {
          if (error) {
            return res.status(404).json({ status: 'Not Found', data: error, message: "Error fetching issue records" })
          }
          else {
            return res.status(200).json({ status: 'OK', data: result.recordset, message: "Issue records displayed" });
          }
        });
      });
    } catch (error) {
      return res.status(500).json({ status: 'NOK', data: error, message: 'Internal server error' });
    }
  },
}

