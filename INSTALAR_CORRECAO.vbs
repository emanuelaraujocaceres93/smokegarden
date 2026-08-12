REM Corretor de Encoding UTF-8 via VBScript
REM Salve como: INSTALAR_CORRECAO.vbs e clique 2x

Set objFSO = CreateObject("Scripting.FileSystemObject")
strPath = objFSO.GetParentFolderName(WScript.ScriptFullName)
Set WshShell = CreateObject("WScript.Shell")

MsgBox "Iniciando correção de encoding UTF-8..." & vbCrLf & vbCrLf & "Clique OK para continuar", vbInformation, "Smoke Garden - Corretor"

Set objFile = objFSO.OpenTextFile(strPath & "\install-fix.js", 1)
strScript = objFile.ReadAll()
objFile.Close()

REM Executar via Node.js
strCmd = "cmd /c cd " & strPath & " && node install-fix.js"
WshShell.Run strCmd, 1, True

MsgBox "✓ Processo concluído!" & vbCrLf & vbCrLf & "Agora execute: npm run build", vbInformation, "Sucesso"
