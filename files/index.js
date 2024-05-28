const db = global.db;
const config = global.config;

module.exports = {
  checkInDB: (req, res) => {
    const username = req.query.username;
    const password = req.query.password;
    try {
      let query = `SELECT [name], [username], [empid], [userType], [designation] FROM Users WHERE username = '${username}' AND password = '${password}' and isStatus='1';`;
      db.connect(config, function (error) {
        if (error) {
          console.log(error);
          return res.status(500).json({ status: 'NOK', data: error, message: 'Database connection error' });
        }
        var request = new db.Request();
        request.query(query, (error, result) => {
          if (error) {
            return res.status(404).json({ status: 'Not Found', data: error, message: "Invalid user" + query })
          } else {
            if (result.recordset.length > 0) {
              return res.status(200).json({ status: 'OK', data: result.recordset, message: "User authenticated successfully" })
            }
            else {
              return res.status(200).json({ status: 'NOK', data: [], message: "Username or password is incorrect" })
            }
          }
        });
      });
    } catch (error) {
      return res.status(500).json({ status: 'NOK', data: error, message: 'Internal server error' });
    }
  },
  insertInDB: (req, res) => {
    const username = req.body.username;
    const fullname = req.body.fullname;
    const empid = req.body.empid;
    try {
      let insertQuery = `INSERT INTO [LoginRecord] (username, logintime, fullName, empid)
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
        request.query(insertQuery, (error, result) => {
          if (error) {
            return res.status(404).json({ status: 'Not Found', data: error, message: "Error in inserting data" })
          } else {
            return res.status(200).json({ status: 'OK', data: result.recordset, message: "Login details recorded successfully" })
          }
        });
      });
    } catch (error) {
      return res.status(500).json({ status: 'NOK', data: error, message: "Something went wrong. Please try again later" })
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
      return res.status(500).json({ status: 'NOK', data: error, message: "Something went wrong. Please try again later" })
    }
  },
  displayName: (req, res) => {
    const empid = req.query.empid;
    try {
      const nameQuery = `SELECT name FROM Users WHERE empid = '${empid}';`;
      db.connect(config, function (error) {
        if (error) {
          console.log(error);
          return res.status(500).json({ status: 'NOK', data: error, message: 'Database connection error' });
        }
        var request = new db.Request();
        request.query(nameQuery, (error, result) => {
          if (error) {
            return res.status(404).json({ status: 'Not Found', data: error, message: "Error fetching name" })
          }
          else {
            const recordName = result.recordset[0].name;
            return res.status(200).json({ status: 'OK', data: recordName, message: "Name displayed" });
          }
        });
      });
    } catch (error) {
      return res.status(500).json({ status: 'NOK', data: error, message: 'Internal server error' });
    }
  },
  displayDesignation: (req, res) => {
    const username = req.query.username;
    try {
      const desigQuery = `SELECT designation FROM Users WHERE username = '${username}';`;
      db.connect(config, function (error) {
        if (error) {
          console.log(error);
          return res.status(500).json({ status: 'NOK', data: error, message: 'Database connection error' });
        }
        var request = new db.Request();
        request.query(desigQuery, (error, result) => {
          if (error) {
            return res.status(404).json({ status: 'Not Found', data: error, message: "Error fetching designation" })
          }
          else {
            const recordDesig = result.recordset[0].designation;
            return res.status(200).json({ status: 'OK', data: recordDesig, message: "Designation displayed" });
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
				where dr.Date> (
				select min(lr.logintime) from LoginRecord lr where lr.username = '${username}'
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
    const empname = req.query.empname;
    try {
      const fetchLeaveQuery = `select 
      ROW_NUMBER() OVER (ORDER BY fromDate) AS SNo, id,
      EmpID, EmpName, 
      FORMAT(FromDate, 'dd-MMM-yyyy') AS FromDate,
      FORMAT(ToDate, 'dd-MMM-yyyy') AS ToDate,
      NoOfLeave, FullDay, FirstHalf, SecondHalf, 
      Reason, Status, RejectReason
      from LeaveRecord where EmpName = '${empname}';`;
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
        //		pendingQuery = `
        //    SELECT * FROM (
        //    SELECT
        //    ROW_NUMBER() OVER (ORDER BY fromDate) AS SNo,
        //  id,
        // EmpID,
        //         EmpName,
        //       FORMAT(fromDate, 'dd-MMM-yyyy') AS fromDate,
        //     FORMAT(toDate, 'dd-MMM-yyyy') AS toDate,
        //   NoOfLeave,
        // FullDay,
        //          FirstHalf,
        //        SecondHalf,
        //      Reason,
        //    RejectReason,
        //  Status
        //        FROM LeaveRecord
        //    ) AS RowConstrainedResult
        //  WHERE SNo BETWEEN ${startRow} AND ${endRow}`;

        pendingQuery = `select 
        ROW_NUMBER() OVER (ORDER BY fromDate desc) AS SNo, id,
      EmpID, EmpName, 
      FORMAT(fromDate, 'dd-MMM-yyyy') AS fromDate,
      FORMAT(toDate, 'dd-MMM-yyyy') AS toDate,
      NoOfLeave, FullDay, FirstHalf, SecondHalf, Reason, RejectReason, Status
      from LeaveRecord`;
      } else if (userType == 2) {
        //		 pendingQuery = `
        //    SELECT * FROM (
        //    SELECT
        //    ROW_NUMBER() OVER (ORDER BY fromDate) AS SNo,
        //  id,
        //          EmpID,
        //        EmpName,
        //      FORMAT(fromDate, 'dd-MMM-yyyy') AS fromDate,
        //    FORMAT(toDate, 'dd-MMM-yyyy') AS toDate,
        //  NoOfLeave,
        //FirstHalf,
        //          SecondHalf,
        //        Reason,
        //      Status,
        //    RejectReason
        //FROM LeaveRecord
        //        WHERE EmpID = '${empid}'
        //    ) AS RowConstrainedResult
        //  WHERE SNo BETWEEN ${startRow} AND ${endRow}`;
        pendingQuery = `select id,
        EmpID, EmpName, 
        FORMAT(fromDate, 'dd-MMM-yyyy') AS fromDate,
        FORMAT(toDate, 'dd-MMM-yyyy') AS toDate,
        NoOfLeave, FirstHalf, SecondHalf, Reason, Status, RejectReason
        from LeaveRecord where EmpID = '${empid}' order by id desc`;
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
  updateApprove: (req, res) => {
    const EmpID = req.body.EmpID;
    const Id = req.body.Id;
    const Reason = req.body.Reason;
    try {
      const approveQuery = `UPDATE LeaveRecord
      set Status = 'Approved', RejectReason = '${Reason}'
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
      set Status = '${rejectedCancel}', RejectReason = '${rejectReason}'
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
      ,[RejectReason]) 
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
      const lateCountQuery = `SELECT COUNT(DISTINCT logintime) AS DaysWithLateLogin
      FROM LoginRecord lr
      WHERE lr.empid='${empID}' AND 
       CAST(logintime AS TIME) >= DATEADD(MINUTE, ${relaxationTime}, CONVERT(TIME, '09:00:00'))
       AND CAST(logintime AS DATE) BETWEEN '${fromDate}' AND '${toDate}';`;
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
  monthlyEmployee: (req, res) => {
    const empname = req.query.empname;
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
          FORMAT(MIN(lr.logintime), 'hh:mm tt') AS LoginTime
      FROM DateRange dr
      LEFT JOIN
      LoginRecord lr ON FORMAT(lr.logintime, 'dd-MMM-yyyy') = FORMAT(dr.Date, 'dd-MMM-yyyy')
        AND lr.fullName = '${empname}'
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
              time: record.LoginTime
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
            return res.status(200).json({ status: 'OK', data: allAbsent, message: "all absent or not checked successfully" })
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
      set @days = '[' + CONVERT(varchar(10), @endDate, 103) + ' (' + DATENAME(weekday, @endDate) + ')]';
      set @CurrentDate=@endDate;
      WHILE (@day > 1)
      BEGIN
          set @CurrentDate=DATEADD(d,-1,@CurrentDate );
          set @days = @days + ',['+CONVERT(varchar(10),@CurrentDate,103) +' ('+DATENAME(weekday,@CurrentDate)+')]'
          set @day = @day - 1
      END
    declare @query varchar(max)
      set @query = 'SELECT *
      FROM
      (
        SELECT 
        fullName AS EmployeeName,
        CONVERT(varchar(10), logintime,103) +'' (''+ DATENAME(weekday,logintime)+'')'' as AttendanceDate,
        CONVERT(VARCHAR(32),MIN(CAST(logintime AS TIME)), 100) AS AttendanceTime
        FROM LoginRecord
          WHERE MONTH(logintime) = ' + CONVERT(VARCHAR,@month) + '
          AND YEAR(logintime) = ' + CONVERT(VARCHAR,@year) + '
        GROUP BY fullName, CONVERT(varchar(10), logintime,103) +'' (''+ DATENAME(weekday,logintime)+'')''
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
            return res.status(404).json({ status: 'Not Found', data: error, message: "Error fetching monthly report" })
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
      set @days = '[' + CONVERT(varchar(10), @endDate, 103) + ' (' + DATENAME(weekday, @endDate) + ')]';
      set @CurrentDate=@endDate;
      WHILE (@day > 1)
      BEGIN
          set @CurrentDate=DATEADD(d,-1,@CurrentDate );
          set @days = @days + ',['+CONVERT(varchar(10),@CurrentDate,103) +' ('+DATENAME(weekday,@CurrentDate)+')]'
          set @day = @day - 1
      END
    declare @query varchar(max)
      set @query = 'SELECT *
      FROM
      (
        SELECT 
        fullName AS EmployeeName,
        CONVERT(varchar(10), logintime,103) +'' (''+ DATENAME(weekday,logintime)+'')'' as AttendanceDate,
        CONVERT(VARCHAR(32),MIN(CAST(logintime AS TIME)), 100) AS AttendanceTime
        FROM LoginRecord
          WHERE MONTH(logintime) = ' + CONVERT(VARCHAR,@month) + '
          AND YEAR(logintime) = ' + CONVERT(VARCHAR,@year) + '
          AND empid = ''' + @empid + '''
          GROUP BY fullName, CONVERT(varchar(10), logintime,103) +'' (''+ DATENAME(weekday,logintime)+'')''
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
            return res.status(404).json({ status: 'Not Found', data: error, message: "Error fetching monthly report" })
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
  deleteLeave: (req, res) => {
    const EmpID = req.body.EmpID;
    const FromDate = req.body.FromDate;
    try {
      const deleteQuery = `DELETE FROM LeaveRecord
      where EmpID = '${EmpID}' AND FromDate = '${FromDate}';`;
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
            return res.status(200).json({ status: 'OK', data: result.recordset, message: "Approved status updated" });
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
  empLeaves: (req, res) => {
    try {
      const empLeavesQuery = `SELECT 
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
          WHERE u.isStatus = 1
          GROUP BY u.name;`;
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
  futureLeaves: (req, res) => {
    const empid = req.query.empid;
    try {
      const futureLeavesQuery = `SELECT 
        FORMAT(FromDate, 'dd-MMMM-yyyy') AS FromDate,
        FORMAT(ToDate, 'dd-MMMM-yyyy') AS ToDate,
        NoOfLeave as Days, Status 
      FROM LeaveRecord
        WHERE FromDate >= GETDATE()
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
  onLeave: (req, res) => {
    const empid = req.query.empid;
    try {
      const futureLeavesQuery = `Select EmpID, EmpName 
      from LeaveRecord 
      where  Status = 'Approved' AND
      CAST(GETDATE() AS DATE) BETWEEN FromDate AND ToDate;`;
      db.connect(config, function (error) {
        if (error) {
          console.log(error);
          return res.status(500).json({ status: 'NOK', data: error, message: 'Database connection error' });
        }
        var request = new db.Request();
        request.query(futureLeavesQuery, (error, result) => {
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
              WHEN DATEADD(YEAR, DATEDIFF(YEAR, birthday, @Today), birthday) >= @Today
                   AND DATEADD(YEAR, DATEDIFF(YEAR, birthday, @Today), birthday) <= @EndDate
              THEN DATEADD(YEAR, DATEDIFF(YEAR, birthday, @Today), birthday)
              ELSE DATEADD(YEAR, DATEDIFF(YEAR, birthday, @Today) + 1, birthday)
          END, 'dd-MMM-yyyy') AS UpcomingBirthday
      FROM
          Users
      WHERE isStatus = 1 AND
          CASE
              WHEN DATEADD(YEAR, DATEDIFF(YEAR, birthday, @Today), birthday) >= @Today
                   AND DATEADD(YEAR, DATEDIFF(YEAR, birthday, @Today), birthday) <= @EndDate
              THEN DATEADD(YEAR, DATEDIFF(YEAR, birthday, @Today), birthday)
              ELSE DATEADD(YEAR, DATEDIFF(YEAR, birthday, @Today) + 1, birthday)
          END BETWEEN @Today AND @EndDate
      ORDER BY
          UpcomingBirthday;
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
        Late
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
  changePassword: (req, res) => {
    const EmpID = req.body.EmpID;
    const Password = req.body.Password;
    try {
      const passwordQuery = `UPDATE Users
      set password = '${Password}'
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
}

