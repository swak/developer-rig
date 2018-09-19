@ECHO OFF
SETLOCAL

REM Check if configuration is required.
CALL "%~dp0check-configure.cmd"
IF ERRORLEVEL 2 (
	CALL "%~dp0configure.cmd"
	IF NOT ERRORLEVEL 1 (
		net file > NUL 2> NUL
		IF ERRORLEVEL 1 (
			ECHO When configuration completes,
			PAUSE
			COPY NUL NUL > NUL
		)
	)
) ELSE IF ERRORLEVEL 1 (
	EXIT /B
)
IF NOT ERRORLEVEL 1 CALL :path_and_check
IF ERRORLEVEL 1 (
	ECHO Configuration did not complete properly.  You will need to correct the
	ECHO problems and re-run this script.
	EXIT /B
)

# Start the Developer Rig.
yarn start
EXIT /B

REM If the configure script installed the prerequisites, these are their paths.
:path_and_check
PATH %PATH%;%SystemDrive%\Python27;%ProgramFiles%\nodejs;%ProgramFiles(x86)%\Yarn\bin
CALL "%~dp0check-configure.cmd"
