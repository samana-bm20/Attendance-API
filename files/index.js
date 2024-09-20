const db = global.db;
const config = global.config;
const bcrypt = global.bcrypt;
const path = global.path;
const fs = global.fs;
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
    const empid = req.query.empid;
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
                AND lr.empid = '${empid}'
				where CAST(dr.Date AS DATE) >= (
				select CAST(min(lr.logintime) AS DATE) from LoginRecord lr where lr.empid = '${empid}'
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
    const joiningDate = new Date(req.body.joiningDate);
    const paidLeave = req.body.paidLeave;

    const dob = birthday.toISOString().split('T')[0];

    const doj = joiningDate.toISOString().split('T')[0];
    try {
      // const hashedPassword = await bcrypt.hash(password, saltRounds);
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
                      const addUserQuery = `INSERT INTO [dbo].[Users] 
                      ([username] ,[password] ,[name] ,
                      [designation] ,[empid] ,[userType] ,
                      [isStatus] ,[birthday], [PaidLeave], [joiningDate]) 
                      VALUES 
                      ('${username}' ,'${password}' ,
                      '${name}' ,'${designation}' ,
                      '${empid}', 2, 1,'${dob}', ${paidLeave}, '${doj}')`;

                      const addPersonalQuery = `INSERT INTO [dbo].[PersonalDetails] 
                      ([empid] ,[empName]) VALUES ('${empid}' , '${name}')`;

                      const addProfileQuery = `INSERT INTO [dbo].[ProfileInfo] (EmpId, photo)
                        SELECT '${empid}', photo FROM ProfileInfo
                        WHERE EmpId = 'ML35'`;

                      db.connect(config, function (error) {
                        if (error) {
                          console.log(error);
                          return res.status(500).json({ status: 'NOK', data: error, message: 'Database connection error' });
                        }
                        var request = new db.Request();
                        request.query(addUserQuery, (error, result) => {
                          if (error) {
                            return res.status(404).json({ status: 'NOK', data: error, message: "Error adding new employee" })
                          }
                          else {
                            request.query(addPersonalQuery, (error, result) => {
                              if (error) {
                                return res.status(404).json({ status: 'NOK', data: error, message: "Error adding data to second table" });
                              } else {
                                request.query(addProfileQuery, (error, result) => {
                                  if (error) {
                                    return res.status(404).json({ status: 'NOK', data: error, message: "Error adding data to third table" });
                                  } else {
                                    return res.status(200).json({ status: 'OK', data: result.recordset, message: "Employee has been successfully added" });
                                  }
                                });
                              }
                            });
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
    const username = req.body.username.trim();
    const designation = req.body.designation.trim();
    const statusEmploy = req.body.statusEmploy;
    const birthday = new Date(req.body.birthday);
    const paidLeave = req.body.paidLeave;
    const fromDate = birthday.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).replace(/ /g, '-');

    try {
      // const hashedPassword = await bcrypt.hash(password, saltRounds);
      const updateUserQuery = `UPDATE [dbo].[Users] 
      SET [password] = '${password}', 
      [username] = '${username}', 
      [designation] = '${designation}', 
      [isStatus] = LTRIM(RTRIM('${statusEmploy}')), 
      [birthday] = '${fromDate}',
      [PaidLeave] = ${paidLeave} 
      WHERE [uid] = '${uid}'`;
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
      const roleChangeQuery = `UPDATE [dbo].[Users] 
      SET [userType] = '${userType}' 
      WHERE [uid] = '${uid}'`;
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
      let fetchEmpQuery = `SELECT ROW_NUMBER() OVER (ORDER BY isStatus DESC, empid ASC) AS SNo, uid
      ,username
      ,password
      ,name
      ,designation
      ,empid
      ,userType
      ,isStatus
      ,FORMAT(birthday, 'dd-MMM-yyyy') AS birthday
      ,PaidLeave
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
  fetchLeave: (req, res) => {
    const empid = req.query.empid;
    const startDate = req.query.startDate;
    const endDate = req.query.endDate;
    try {
      const fetchLeaveQuery = `select 
      ROW_NUMBER() OVER (ORDER BY id) AS SNo, id,
      EmpID, EmpName, 
      FORMAT(FromDate, 'dd-MMM-yyyy') AS FromDate,
      FORMAT(ToDate, 'dd-MMM-yyyy') AS ToDate,
      NoOfLeave, FirstHalf, SecondHalf, 
      Reason, Status, Remarks
      from LeaveRecord where EmpID = '${empid}'
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
        ROW_NUMBER() OVER (
        ORDER BY 
            CASE 
                WHEN Status = 'Pending' THEN id 
                ELSE NULL 
            END DESC,
            CASE 
                WHEN Status <> 'Pending' THEN fromDate 
                ELSE NULL 
            END DESC
    ) AS SNo, id,
      EmpID, EmpName, 
      FORMAT(fromDate, 'dd-MMM-yyyy') AS fromDate,
      FORMAT(toDate, 'dd-MMM-yyyy') AS toDate,
      NoOfLeave, FirstHalf, SecondHalf, Reason, Remarks, Status
      from LeaveRecord`;
      } else if (userType == 2 || userType == 3) {
        pendingQuery = `select 
        ROW_NUMBER() OVER (
        ORDER BY 
            CASE 
                WHEN Status = 'Pending' THEN id 
                ELSE NULL 
            END DESC,
            CASE 
                WHEN Status <> 'Pending' THEN fromDate 
                ELSE NULL 
            END DESC
    ) AS SNo, id,
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
        ROW_NUMBER() OVER (
        ORDER BY 
            CASE 
                WHEN Status = 'Pending' THEN id 
                ELSE NULL 
            END DESC,
            CASE 
                WHEN Status <> 'Pending' THEN fromDate 
                ELSE NULL 
            END DESC
    ) AS SNo, id,
      EmpID, EmpName, 
      FORMAT(fromDate, 'dd-MMM-yyyy') AS fromDate,
      FORMAT(toDate, 'dd-MMM-yyyy') AS toDate,
      NoOfLeave, FirstHalf, SecondHalf, Reason, Remarks, Status
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
  updateRejectPullback: (req, res) => {
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
  deleteApproved: (req, res) => {
    const { Id } = req.body;
    try {
      const deleteQuery = `DELETE FROM LeaveRecord where id = '${Id}'`;
      db.connect(config, function (error) {
        if (error) {
          console.log(error);
          return res.status(500).json({ status: 'NOK', data: error, message: 'Database connection error' });
        }
        var request = new db.Request();
        request.query(deleteQuery, (error, result) => {
          if (error) {
            return res.status(404).json({ status: 'Not Found', data: error, message: "Error deleting record" })
          }
          else {
            return res.status(200).json({ status: 'OK', data: result.recordset, message: "Record deleted successfully" });
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

      const addleaveQuery = `
      DECLARE @EmpID VARCHAR(255) = '${EmpID}';
      DECLARE @EmpName VARCHAR(255) = '${empName}';
      DECLARE @FromDate DATE = '${fromDate}';
      DECLARE @ToDate DATE = '${toDate}';
      DECLARE @NoOfLeave FLOAT = ${NoOfLeave};
      DECLARE @FirstHalf INT = ${firstHalf};
      DECLARE @SecondHalf INT = ${secondHalf};
      DECLARE @Reason NVARCHAR(255) = '${reason}';
      DECLARE @Status VARCHAR(255) = '${status}';
      DECLARE @Remarks VARCHAR(255) = '${remark}';

      DECLARE @HolidayCount INT;

      SET @HolidayCount = (
          SELECT COUNT(*)
        FROM Holiday
        WHERE Date BETWEEN @FromDate AND @ToDate
      );

      SET @NoOfLeave = @NoOfLeave - @HolidayCount;

      INSERT INTO [dbo].[LeaveRecord]
            ([EmpID]
            ,[EmpName]
            ,[FromDate]
            ,[ToDate]
            ,[NoOfLeave]
            ,[FirstHalf]
            ,[SecondHalf]
            ,[Reason]
            ,[Status]
            ,[Remarks]) 
            VALUES
            (@EmpID
            ,@EmpName
            ,@FromDate
            ,@ToDate
            ,@NoOfLeave
            ,@FirstHalf
            ,@SecondHalf
            ,@Reason
            ,@Status
            ,@Remarks)`;
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
      let absentQuery = `SELECT CASE 
           WHEN (totalUsers - loggedInUsers) > (totalUsers / 2) 
           THEN 1 
           ELSE 0 
       END AS allAbsent
FROM (
    SELECT 
        (SELECT COUNT(*) FROM Users) AS totalUsers,
        (SELECT COUNT(*) 
         FROM LoginRecord 
         WHERE CAST(logintime AS DATE) = '${date}' AND logintime IS NOT NULL
        ) AS loggedInUsers
) AS counts;  `;
      // let absentQuery = `SELECT CASE WHEN COUNT(*) = 0 THEN 1 ELSE 0 END AS allAbsent
      // FROM LoginRecord
      // WHERE CAST(logintime AS DATE) = '${date}' AND logintime IS NOT NULL`;

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
      const empIdNameQuery = `SELECT empid, name FROM Users WHERE isStatus = 1 
      AND empid NOT IN('001', '003', 'ML35') ORDER BY empid;`;
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
      const employeeQuery = `EXEC GetMonthlyAttendanceReport @month = '${month}', @year = '${year}'`;
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
      const employeeQuery = `EXEC GetMonthlyAttendanceReport @month = '${month}', @year = '${year}', @EmpID = '${empid}'`;
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
  paidLeaves: (req, res) => {
    const empid = req.query.empid;
    try {
      const paidLeaveQuery = `Select PaidLeave
      from Users
      where empid ='${empid}'`;
      db.connect(config, function (error) {
        if (error) {
          console.log(error);
          return res.status(500).json({ status: 'NOK', data: error, message: 'Database connection error' });
        }
        var request = new db.Request();
        request.query(paidLeaveQuery, (error, result) => {
          if (error) {
            return res.status(404).json({ status: 'Not Found', data: error, message: "Error fetching paid leaves" })
          }
          else {
            return res.status(200).json({ status: 'OK', data: result.recordset, message: "paid leaves displayed" });
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
	  u.PaidLeave AS PaidLeave,
      ISNULL(SUM(lr.NoOfLeave),0) AS LeavesUsed,
	  (u.PaidLeave-ISNULL(SUM(lr.NoOfLeave),0)) AS Balance
      FROM Users u 
      LEFT JOIN 
        (
          SELECT * FROM LeaveRecord lr WHERE
          lr.Status = 'Approved' 
          and YEAR(lr.FromDate) = YEAR(GETDATE())
        )lr 
          ON u.empid = lr.EmpID
          WHERE u.isStatus = 1 AND u.empid NOT IN ('001', '003', 'ML35')
          GROUP BY u.empid, u.name, u.PaidLeave
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
      WHERE u.isStatus = 1 AND u.empid NOT IN ('001', '003', 'ML35')
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
        WHERE CAST(GETDATE() AS DATE) <= ToDate
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
          AND CAST(logintime AS DATE) <= CAST(GETDATE() AS DATE)
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
      const countQuery = `EXEC [CalculateAttendanceStatistics] @viewdate = '${viewdate}', @empid = '${empid}' `;
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
                        ROW_NUMBER() OVER (
        ORDER BY 
            CASE 
                WHEN Status = 'Pending' THEN id 
                ELSE NULL 
            END DESC,
            CASE 
                WHEN Status <> 'Pending' THEN fromDate 
                ELSE NULL 
            END DESC
    ) AS SNo, id,
                        EmpID, EmpName, 
                        FORMAT(fromDate, 'dd-MMM-yyyy') AS fromDate,
                        FORMAT(toDate, 'dd-MMM-yyyy') AS toDate,
                        Mode, FirstHalf, SecondHalf, Reason, Status, Remarks
                        from [OfficialDuty]`;
      } else if (userType == 2 || userType == 3) {
        pendingQuery = `select 
                        ROW_NUMBER() OVER (
        ORDER BY 
            CASE 
                WHEN Status = 'Pending' THEN id 
                ELSE NULL 
            END DESC,
            CASE 
                WHEN Status <> 'Pending' THEN fromDate 
                ELSE NULL 
            END DESC
    ) AS SNo, id,
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
                                ROW_NUMBER() OVER (
        ORDER BY 
            CASE 
                WHEN Status = 'Pending' THEN id 
                ELSE NULL 
            END DESC,
            CASE 
                WHEN Status <> 'Pending' THEN fromDate 
                ELSE NULL 
            END DESC
    ) AS SNo, id,
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
    const empid = req.query.empid;
    const startDate = req.query.startDate;
    const endDate = req.query.endDate;
    try {
      const fetchOfficialDutyQuery = `  select 
      ROW_NUMBER() OVER (ORDER BY id) AS SNo, id,
      Empid, EmpName, 
      FORMAT(FromDate, 'dd-MMM-yyyy') AS FromDate,
      FORMAT(ToDate, 'dd-MMM-yyyy') AS ToDate,
      Mode, FirstHalf, SecondHalf, 
      Reason, Status, Remarks
      from OfficialDuty where Empid = '${empid}'
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
      const ODLoginQuery = ` EXEC InsertOfficialDuty @id = ${id}`;
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
  addLog: (req, res) => {
    const logDate = req.body.logDate.trim();
    const description = req.body.description.trim();
    const recordedBy = req.body.recordedBy.trim();
    try {
      const addLogQuery = `
      INSERT INTO Log 
      (logDate, description, RecordedBy) 
      VALUES ('${logDate}', '${description}', '${recordedBy}');`;
      db.connect(config, function (error) {
        if (error) {
          console.log(error);
          return res.status(500).json({ status: 'NOK', data: error, message: 'Database connection error' });
        }
        var request = new db.Request();
        request.query(addLogQuery, (error, result) => {
          if (error) {
            return res.status(404).json({ status: 'NOK', data: error, message: "Error adding log" })
          }
          else {
            return res.status(200).json({ status: 'OK', data: result.recordset, message: "Log Added" });
          }
        });
      });
    } catch (error) {
      return res.status(500).json({ status: 'NOK', data: error, message: 'Internal server error' });
    }
  },
  editLog: (req, res) => {
    const id = req.body.id;
    const logDate = req.body.logDate.trim();
    const description = req.body.description.trim();
    try {
      const editLogQuery = `
       UPDATE Log SET logDate = '${logDate}', description = '${description}'where id=${id}`;
      db.connect(config, function (error) {
        if (error) {
          console.log(error);
          return res.status(500).json({ status: 'NOK', data: error, message: 'Database connection error' });
        }
        var request = new db.Request();
        request.query(editLogQuery, (error, result) => {
          if (error) {
            return res.status(404).json({ status: 'NOK', data: error, message: "Error editing log" })
          }
          else {
            return res.status(200).json({ status: 'OK', data: result.recordset, message: "Log Edited" });
          }
        });
      });
    } catch (error) {
      return res.status(500).json({ status: 'NOK', data: error, message: 'Internal server error' });
    }
  },
  fetchLog: (req, res) => {
    try {
      const fetchLogQuery = `
        SELECT id,
	        ROW_NUMBER() Over (Order by logDate DESC) As SNo,
	        FORMAT(logDate, 'dd-MMM-yyyy') As logDate,
	        description, RecordedBy FROM Log;`;
      db.connect(config, function (error) {
        if (error) {
          console.log(error);
          return res.status(500).json({ status: 'NOK', data: error, message: 'Database connection error' });
        }
        var request = new db.Request();
        request.query(fetchLogQuery, (error, result) => {
          if (error) {
            return res.status(404).json({ status: 'Not Found', data: error, message: "Error fetching log records" })
          }
          else {
            return res.status(200).json({ status: 'OK', data: result.recordset, message: "Log records displayed" });
          }
        });
      });
    } catch (error) {
      return res.status(500).json({ status: 'NOK', data: error, message: 'Internal server error' });
    }
  },
  salaryReportMonthWise: (req, res) => {
    const { MonthYear } = req.query;
    try {
      const salaryReportQuery = `EXEC [GetMonthlyEmployeeData] @MonthYear = '${MonthYear}'`;
      db.connect(config, function (error) {
        if (error) {
          console.log(error);
          return res.status(500).json({ status: 'NOK', data: error, message: 'Database connection error' });
        }
        var request = new db.Request();
        request.query(salaryReportQuery, (error, result) => {
          if (error) {
            return res.status(404).json({ status: 'Not Found', data: error, message: "Error fetching salary report" })
          }
          else {
            return res.status(200).json({ status: 'OK', data: result.recordset, message: "Salary report displayed" });
          }
        });
      });
    } catch (error) {
      return res.status(500).json({ status: 'NOK', data: error, message: 'Internal server error' });
    }
  },
  getInformation: (req, res) => {
    const empid = req.query.empid;
    try {
      const getInfoQuery = `
      SELECT 
        empid,
        name,
        emailID,
        contactNo,
        secondaryContact,
        CAST(birthday AS DATE) AS Birthday,
        CAST(joiningDate AS DATE) AS joiningDate,
        qualification,
        skillSet1,
        skillSet2,
        skillSet3,
        skillSet4,
        designation 
      from Users where empid = '${empid}'`;
      db.connect(config, function (error) {
        if (error) {
          console.log(error);
          return res.status(500).json({ status: 'NOK', data: error, message: 'Database connection error' });
        }
        var request = new db.Request();
        request.query(getInfoQuery, (error, result) => {
          if (error) {
            return res.status(404).json({ status: 'Not Found', data: error, message: "Error fetching employee info" })
          }
          else {
            return res.status(200).json({ status: 'OK', data: result.recordset, message: "Employee info displayed" });
          }
        });
      });
    } catch (error) {
      return res.status(500).json({ status: 'NOK', data: error, message: 'Internal server error' });
    }
  },
  updateEmail: (req, res) => {
    const empid = req.body.empid;
    const email = req.body.email;
    try {
      const updateEmailQuery = `UPDATE Users
      set emailID = '${email}'
      where empid = '${empid}';`;
      db.connect(config, function (error) {
        if (error) {
          console.log(error);
          return res.status(500).json({ status: 'NOK', data: error, message: 'Database connection error' });
        }
        var request = new db.Request();
        request.query(updateEmailQuery, (error, result) => {
          if (error) {
            return res.status(404).json({ status: 'Not Found', data: error, message: "Error updating email" })
          }
          else {
            return res.status(200).json({ status: 'OK', data: result.recordset, message: "Email updated" });
          }
        });
      });
    } catch (error) {
      return res.status(500).json({ status: 'NOK', data: error, message: 'Internal server error' });
    }
  },
  updateContact: (req, res) => {
    const empid = req.body.empid;
    const contact = req.body.contact;
    try {
      const updateContactQuery = `UPDATE Users
      set contactNo = '${contact}'
      where empid = '${empid}';`;
      db.connect(config, function (error) {
        if (error) {
          console.log(error);
          return res.status(500).json({ status: 'NOK', data: error, message: 'Database connection error' });
        }
        var request = new db.Request();
        request.query(updateContactQuery, (error, result) => {
          if (error) {
            return res.status(404).json({ status: 'Not Found', data: error, message: "Error updating contact" })
          }
          else {
            return res.status(200).json({ status: 'OK', data: result.recordset, message: "Contact updated" });
          }
        });
      });
    } catch (error) {
      return res.status(500).json({ status: 'NOK', data: error, message: 'Internal server error' });
    }
  },
  updateSecondaryContact: (req, res) => {
    const empid = req.body.empid;
    const secondaryContact = req.body.secondaryContact;
    try {
      const updateSecondaryContactQuery = `UPDATE Users
      set secondaryContact = '${secondaryContact}'
      where empid = '${empid}';`;
      db.connect(config, function (error) {
        if (error) {
          console.log(error);
          return res.status(500).json({ status: 'NOK', data: error, message: 'Database connection error' });
        }
        var request = new db.Request();
        request.query(updateSecondaryContactQuery, (error, result) => {
          if (error) {
            return res.status(404).json({ status: 'Not Found', data: error, message: "Error updating contact" })
          }
          else {
            return res.status(200).json({ status: 'OK', data: result.recordset, message: "Contact updated" });
          }
        });
      });
    } catch (error) {
      return res.status(500).json({ status: 'NOK', data: error, message: 'Internal server error' });
    }
  },
  updateQualification: (req, res) => {
    const empid = req.body.empid;
    const qualification = req.body.qualification;
    try {
      const updateQualificationQuery = `UPDATE Users
      set qualification = '${qualification}'
      where empid = '${empid}';`;
      db.connect(config, function (error) {
        if (error) {
          console.log(error);
          return res.status(500).json({ status: 'NOK', data: error, message: 'Database connection error' });
        }
        var request = new db.Request();
        request.query(updateQualificationQuery, (error, result) => {
          if (error) {
            return res.status(404).json({ status: 'Not Found', data: error, message: "Error updating qualification" })
          }
          else {
            return res.status(200).json({ status: 'OK', data: result.recordset, message: "Qualification updated" });
          }
        });
      });
    } catch (error) {
      return res.status(500).json({ status: 'NOK', data: error, message: 'Internal server error' });
    }
  },
  updateSkillSet1: (req, res) => {
    const empid = req.body.empid;
    const skillSet1 = req.body.skillSet1;
    try {
      const updateSkillSet1Query = `UPDATE Users
      set skillSet1 = '${JSON.stringify(skillSet1)}'
      where empid = '${empid}';`;
      db.connect(config, function (error) {
        if (error) {
          console.log(error);
          return res.status(500).json({ status: 'NOK', data: error, message: 'Database connection error' });
        }
        var request = new db.Request();
        request.query(updateSkillSet1Query, (error, result) => {
          if (error) {
            return res.status(404).json({ status: 'Not Found', data: error, message: "Error updating skills" })
          }
          else {
            return res.status(200).json({ status: 'OK', data: result.recordset, message: "Skills updated" });
          }
        });
      });
    } catch (error) {
      return res.status(500).json({ status: 'NOK', data: error, message: 'Internal server error' });
    }
  },
  updateSkillSet2: (req, res) => {
    const empid = req.body.empid;
    const skillSet2 = req.body.skillSet2;
    try {
      const updateSkillSet2Query = `UPDATE Users
      set skillSet2 = '${JSON.stringify(skillSet2)}'
      where empid = '${empid}';`;
      db.connect(config, function (error) {
        if (error) {
          console.log(error);
          return res.status(500).json({ status: 'NOK', data: error, message: 'Database connection error' });
        }
        var request = new db.Request();
        request.query(updateSkillSet2Query, (error, result) => {
          if (error) {
            return res.status(404).json({ status: 'Not Found', data: error, message: "Error updating skills" })
          }
          else {
            return res.status(200).json({ status: 'OK', data: result.recordset, message: "Skills updated" });
          }
        });
      });
    } catch (error) {
      return res.status(500).json({ status: 'NOK', data: error, message: 'Internal server error' });
    }
  },
  updateSkillSet3: (req, res) => {
    const empid = req.body.empid;
    const skillSet3 = req.body.skillSet3;
    try {
      const updateSkillSet3Query = `UPDATE Users
      set skillSet3 = '${JSON.stringify(skillSet3)}'
      where empid = '${empid}';`;
      db.connect(config, function (error) {
        if (error) {
          console.log(error);
          return res.status(500).json({ status: 'NOK', data: error, message: 'Database connection error' });
        }
        var request = new db.Request();
        request.query(updateSkillSet3Query, (error, result) => {
          if (error) {
            return res.status(404).json({ status: 'Not Found', data: error, message: "Error updating skills" })
          }
          else {
            return res.status(200).json({ status: 'OK', data: result.recordset, message: "Skills updated" });
          }
        });
      });
    } catch (error) {
      return res.status(500).json({ status: 'NOK', data: error, message: 'Internal server error' });
    }
  },
  updateSkillSet4: (req, res) => {
    const empid = req.body.empid;
    const skillSet4 = req.body.skillSet4;
    try {
      const updateSkillSet4Query = `UPDATE Users
      set skillSet4 = '${JSON.stringify(skillSet4)}'
      where empid = '${empid}';`;
      db.connect(config, function (error) {
        if (error) {
          console.log(error);
          return res.status(500).json({ status: 'NOK', data: error, message: 'Database connection error' });
        }
        var request = new db.Request();
        request.query(updateSkillSet4Query, (error, result) => {
          if (error) {
            return res.status(404).json({ status: 'Not Found', data: error, message: "Error updating skills" })
          }
          else {
            return res.status(200).json({ status: 'OK', data: result.recordset, message: "Skills updated" });
          }
        });
      });
    } catch (error) {
      return res.status(500).json({ status: 'NOK', data: error, message: 'Internal server error' });
    }
  },
  profilePictureUpload: (req, res) => {
    try {
      const { empid } = req.body;
      const profilePicture = req.file.buffer;

      const addleaveQuery = `MERGE [ProfileInfo] AS target
      USING (SELECT @empid AS EmpId, @profilePicture AS Photo) AS source
      ON (target.EmpId = source.EmpId)
      WHEN MATCHED THEN
        UPDATE SET [photo] = source.Photo
      WHEN NOT MATCHED THEN
        INSERT (EmpId, photo)
        VALUES (source.EmpId, source.Photo);`;
      var request = new db.Request();
      request.input('profilePicture', db.VarBinary, profilePicture);
      request.input('empid', db.NVarChar, empid);
      db.connect(config, function (error) {
        if (error) {
          console.log(error);
          return res.status(500).json({ status: 'NOK', data: error, message: 'Database connection error' });
        }

        request.query(addleaveQuery, (error, result) => {
          if (error) {
            return res.status(404).json({ status: 'NOK', data: error, message: "Error Uploading Image request" })
          }
          else {
            return res.status(200).json({ status: 'OK', data: result.recordset, message: "Image Upload Successfully..!!" });
          }
        });
      });
    } catch (error) {
      return res.status(500).json({ status: 'NOK', data: error, message: 'Internal server error' });
    }
  },
  getProfilePhoto: (req, res) => {
    try {
      const { empid_ } = req.query;
      const fetchQuery = `SELECT [photo] FROM [ProfileInfo] WHERE [EmpId] = @empid`;
      db.connect(config, function (error) {
        if (error) {
          console.log(error);
          return res.status(500).json({ status: 'NOK', data: error, message: 'Database connection error' });
        }
        var request = new db.Request();
        request.input('empid', db.VarChar, empid_);
        request.query(fetchQuery, (error, result) => {
          if (error) {
            return res.status(404).json({ status: 'NOK', data: error, message: "Error fetching image" });
          } else if (result.recordset.length > 0) {
            const imageBuffer = result.recordset[0].photo;
            res.setHeader('Content-Type', 'image/jpeg'); // adjust the content type based on the stored image format
            res.send(imageBuffer);
          } else {
            return res.status(404).json({ status: 'NOK', message: "Image not found" });
          }
        });
      });
    } catch (error) {
      return res.status(500).json({ status: 'NOK', data: error, message: 'Internal server error' });
    }
  },
  getPersonalDetails: (req, res) => {
    const empid = req.query.empid;
    try {
      const getInfoQuery = `
      SELECT 
      empid, empName,
      currentAddress,
      sameAsCurrent,
      permanentAddress,
      Dependency
      FROM PersonalDetails
      WHERE empid = '${empid}'`;
      db.connect(config, function (error) {
        if (error) {
          console.log(error);
          return res.status(500).json({ status: 'NOK', data: error, message: 'Database connection error' });
        }
        var request = new db.Request();
        request.query(getInfoQuery, (error, result) => {
          if (error) {
            return res.status(404).json({ status: 'Not Found', data: error, message: "Error fetching personal details" })
          }
          else {
            return res.status(200).json({ status: 'OK', data: result.recordset, message: "Personal details displayed" });
          }
        });
      });
    } catch (error) {
      return res.status(500).json({ status: 'NOK', data: error, message: 'Internal server error' });
    }
  },
  updateCurrentAddress: (req, res) => {
    const empid = req.body.empid;
    const currentAddress = req.body.currentAddress;
    try {
      const updateCurrentAddressQuery = `UPDATE PersonalDetails
      set currentAddress = '${JSON.stringify(currentAddress)}'
      where empid = '${empid}';`;
      db.connect(config, function (error) {
        if (error) {
          console.log(error);
          return res.status(500).json({ status: 'NOK', data: error, message: 'Database connection error' });
        }
        var request = new db.Request();
        request.query(updateCurrentAddressQuery, (error, result) => {
          if (error) {
            return res.status(404).json({ status: 'Not Found', data: error, message: "Error updating current address" })
          }
          else {
            return res.status(200).json({ status: 'OK', data: result.recordset, message: "Current address updated" });
          }
        });
      });
    } catch (error) {
      return res.status(500).json({ status: 'NOK', data: error, message: 'Internal server error' });
    }
  },
  updatePermanentAddress: (req, res) => {
    const empid = req.body.empid;
    const sameAsCurrent = req.body.sameAsCurrent;
    const permanentAddress = req.body.permanentAddress;
    try {
      const updatePermanentAddressQuery = `UPDATE PersonalDetails
      set sameAsCurrent = ${sameAsCurrent}, permanentAddress = '${JSON.stringify(permanentAddress)}'
      where empid = '${empid}';`;
      db.connect(config, function (error) {
        if (error) {
          console.log(error);
          return res.status(500).json({ status: 'NOK', data: error, message: 'Database connection error' });
        }
        var request = new db.Request();
        request.query(updatePermanentAddressQuery, (error, result) => {
          if (error) {
            return res.status(404).json({ status: 'Not Found', data: error, message: "Error updating permanent address" })
          }
          else {
            return res.status(200).json({ status: 'OK', data: result.recordset, message: "Permanent address updated" });
          }
        });
      });
    } catch (error) {
      return res.status(500).json({ status: 'NOK', data: error, message: 'Internal server error' });
    }
  },
  documentUpload: (req, res) => {
    try {
      const { empId, uploadedBy } = req.body;
      const filePath = req.file.path;
      const fileName = req.body.docName;

      const addDocumentQuery = `INSERT INTO Documents (EmpId, DocPath, DocName, UploadedBy) VALUES (@EmpId, @DocPath, @DocName, @UploadedBy)`;
      const request = new db.Request();
      request.input('UploadedBy', db.NVarChar, uploadedBy);
      request.input('EmpId', db.NVarChar, empId);
      request.input('DocPath', db.NVarChar, filePath);
      request.input('DocName', db.NVarChar, fileName);

      db.connect(config, function (error) {
        if (error) {
          console.log(error);
          return res.status(500).json({ status: 'NOK', data: error, message: 'Database connection error' });
        }

        request.query(addDocumentQuery, (error, result) => {
          if (error) {
            console.error('Error executing SQL query:', error);
            return res.status(500).json({ status: 'NOK', data: error, message: 'Error executing SQL query' });
          }

          return res.status(200).json({ status: 'OK', data: result.recordset, message: 'Document uploaded successfully' });
        });
      });
    } catch (error) {
      console.error('Internal server error:', error);
      return res.status(500).json({ status: 'NOK', data: error, message: 'Internal server error' });
    }
  },
  getDocuments: (req, res) => {
    try {
      const { empid_ } = req.query;
      const fetchQuery = `SELECT ROW_NUMBER() Over (Order by id ASC) As SNo, id, DocName, DocPath, UploadedBy FROM Documents WHERE EmpId = @empid`;

      db.connect(config, function (error) {
        if (error) {
          console.log(error);
          return res.status(500).json({ status: 'NOK', data: error, message: 'Database connection error' });
        }

        var request = new db.Request();
        request.input('empid', db.VarChar, empid_);
        request.query(fetchQuery, (error, result) => {
          if (error) {
            return res.status(500).json({ status: 'NOK', data: error, message: 'Error fetching documents' });
          } else {
            return res.status(200).json({ status: 'OK', data: result.recordset, message: 'Documents fetched successfully' });
          }
        });
      });
    } catch (error) {
      return res.status(500).json({ status: 'NOK', data: error, message: 'Internal server error' });
    }
  },
  removeDocument: (req, res) => {
    try {
      const id = req.query.id;
      const findQuery = `SELECT DocPath FROM Documents WHERE id = @id`;
      db.connect(config, function (error) {
        if (error) {
          console.log(error);
          return res.status(500).json({ status: 'NOK', data: error, message: 'Database connection error' });
        }

        var request = new db.Request();
        request.input('id', db.NVarChar, id);

        request.query(findQuery, (error, result) => {
          if (error) {
            return res.status(404).json({ status: 'NOK', data: error, message: "Error finding document" });
          }

          if (result.recordset.length === 0) {
            return res.status(404).json({ status: 'NOK', message: "Document not found" });
          }

          const filePath = result.recordset[0].DocPath;
          const fullFilePath = path.join(__dirname, '..', filePath);

          // Delete the file from the public folder
          fs.unlink(fullFilePath, (err) => {
            if (err) {
              return res.status(500).json({ status: 'NOK', message: 'Error deleting file from server', error: err });
            }
            const deleteQuery = `DELETE FROM Documents WHERE id = @id`;
            request.query(deleteQuery, (error, result) => {
              if (error) {
                return res.status(404).json({ status: 'NOK', data: error, message: "Error deleting document" });
              }
              return res.status(200).json({ status: 'OK', message: "Document deleted successfully" });
            });
          });
        });
      });
    } catch (error) {
      return res.status(500).json({ status: 'NOK', data: error, message: 'Internal server error' });
    }
  },
  updateDependency: (req, res) => {
    const empid = req.body.empid;
    const Dependency = req.body.Dependency;
    try {
      const updateDependencyQuery = `UPDATE PersonalDetails
      set Dependency = '${JSON.stringify(Dependency)}'
      where empid = '${empid}';`;
      db.connect(config, function (error) {
        if (error) {
          console.log(error);
          return res.status(500).json({ status: 'NOK', data: error, message: 'Database connection error' });
        }
        var request = new db.Request();
        request.query(updateDependencyQuery, (error, result) => {
          if (error) {
            return res.status(404).json({ status: 'Not Found', data: error, message: "Error updating dependency" })
          }
          else {
            return res.status(200).json({ status: 'OK', data: result.recordset, message: "Dependency updated" });
          }
        });
      });
    } catch (error) {
      return res.status(500).json({ status: 'NOK', data: error, message: 'Internal server error' });
    }
  },
  getHolidayList: (req, res) => {
    try {
      const fetchgetHolidayListQuery = `select 
      ROW_NUMBER() Over (Order by [Date] ASC) As SNo, 
      Format([Date], 'dd-MMM-yyyy') Date, [Day], 
      [HolidayName] from Holiday`;
      db.connect(config, function (error) {
        if (error) {
          console.log(error);
          return res.status(500).json({ status: 'NOK', data: error, message: 'Database connection error' });
        }
        var request = new db.Request();
        request.query(fetchgetHolidayListQuery, (error, result) => {
          if (error) {
            return res.status(404).json({ status: 'Not Found', data: error, message: "Error fetching holiday records" })
          }
          else {
            return res.status(200).json({ status: 'OK', data: result.recordset, message: "Holiday records displayed" });
          }
        });
      });
    } catch (error) {
      return res.status(500).json({ status: 'NOK', data: error, message: 'Internal server error' });
    }
  },
  getEmployeeDOJ: (req, res) => {
    try {
      const getInfoQuery = `
      SELECT 
        empid,
        name,
        CAST(joiningDate AS DATE) AS joiningDate
      from Users ORDER BY empid`;
      db.connect(config, function (error) {
        if (error) {
          console.log(error);
          return res.status(500).json({ status: 'NOK', data: error, message: 'Database connection error' });
        }
        var request = new db.Request();
        request.query(getInfoQuery, (error, result) => {
          if (error) {
            return res.status(404).json({ status: 'Not Found', data: error, message: "Error fetching employee info" })
          }
          else {
            return res.status(200).json({ status: 'OK', data: result.recordset, message: "Employee info displayed" });
          }
        });
      });
    } catch (error) {
      return res.status(500).json({ status: 'NOK', data: error, message: 'Internal server error' });
    }
  },
}

