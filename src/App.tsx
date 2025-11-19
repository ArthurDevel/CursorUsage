import { useState } from 'react';
import './App.css';
import FileUploader from './components/FileUploader';
import Dashboard from './components/Dashboard';
import { parseCSV } from './utils/csvParser';
import type { UsageEvent } from './types';

function App() {
  const [file, setFile] = useState<File | null>(null);
  const [data, setData] = useState<UsageEvent[] | null>(null);
  const [loading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = async (uploadedFile: File) => {
    setFile(uploadedFile);
    setIsLoading(true);
    setError(null);
    try {
      const parsedData = await parseCSV(uploadedFile);
      console.log(`Parsed ${parsedData.length} rows`);
      setData(parsedData);
    } catch (err) {
      console.error(err);
      setError("Failed to parse CSV file.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="app-container">
      <h1>CSV Stats Analyzer</h1>
      
      <div className="card" style={{ maxWidth: data ? '1000px' : '600px', transition: 'max-width 0.3s' }}>
        {!data ? (
           <>
            <FileUploader onFileUpload={handleFileUpload} />
            {loading && <p>Parsing CSV...</p>}
            {error && <p style={{color: 'red'}}>{error}</p>}
           </>
        ) : (
          <div className="file-info">
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                <div>
                    <p><strong>Loaded File:</strong> {file?.name}</p>
                    <p style={{fontSize: '0.8em', color: '#666'}}>{(file!.size / 1024).toFixed(2)} KB | {data.length} rows</p>
                </div>
                <button onClick={() => { setFile(null); setData(null); }}>Upload Different File</button>
            </div>
            
            <Dashboard data={data} />
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
