@ECHO OFF
SETLOCAL

REM Check for valid use.
ECHO ECHO | FIND "ECHO" > NUL 2> NUL
IF ERRORLEVEL 1 (
	ECHO You must run this from a Windows command prompt.
	EXIT /B 1
)

REM Exit with error level 0 if installation is not required.
REM Exit with error level 1 if installation is required but not possible.
REM Exit with error level 2 if installation is required.
CALL :node
IF ERRORLEVEL 2 EXIT /B
IF ERRORLEVEL 1 (
	ECHO Your current version of node is less than 6.  Before re-running this script,
	ECHO you must either uninstall the current version or, if you already have a later
	ECHO version installed, ensure it is earlier in your path so this and other
	ECHO Developer Rig scripts will use it.
	PAUSE
	EXIT /B
)
python --version > NUL 2> NUL
IF ERRORLEVEL 1 EXIT /B 2
CALL yarn --version > NUL 2> NUL
IF ERRORLEVEL 1 EXIT /B 2
EXIT /B

REM Determine if an appropriate version of node is available.
:node
node -v > NUL 2> NUL
IF ERRORLEVEL 1 EXIT /B 2
FOR /F "delims=" %%I IN ('node -v') DO SET VERSION=%%I
IF "%VERSION:~0,1%" == "v" SET VERSION=%VERSION:~1%
IF "%VERSION:~1,1%" == "." (
	SET VERSION=%VERSION:~0,1%
) ELSE (
	SET VERSION=%VERSION:~0,2%
)
IF "%VERSION%" == "" SET VERSION=0
IF %VERSION% LSS 6 EXIT /B 1
