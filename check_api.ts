
import { spawn } from 'child_process';

async function installPythonDeps() {
  console.log('Trying ensurepip...');
  const pipProcess = spawn('python3', ['-m', 'ensurepip', '--upgrade'], {
    stdio: 'inherit'
  });

  pipProcess.on('close', (code) => {
    console.log(`Ensurepip process exited with code ${code}`);
  });
}

installPythonDeps();
