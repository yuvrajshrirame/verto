import { collection, addDoc } from "firebase/firestore";
import { db } from "./firebase"; // This imports the database connection we just made

function App() {
  
  // This is the test function
  const testConnection = async () => {
    try {
      // We are telling Firebase to create a folder called "test_connections"
      // and add a new document inside it.
      const docRef = await addDoc(collection(db, "test_connections"), {
        message: "Verto database is working perfectly!",
        timestamp: new Date()
      });
      
      alert("Success! Check your Firebase Console. Document ID: " + docRef.id);
      
    } catch (error) {
      console.error("Error connecting to Firebase: ", error);
      alert("Uh oh, something went wrong. Check the console.");
    }
  };

  return (
    <div className="h-screen flex flex-col items-center justify-center space-y-6">
      <h1 className="text-4xl font-bold text-amber-400">
        Verto is ALIVE!
      </h1>
      
      {/* Our new test button */}
      <button 
        onClick={testConnection}
        className="bg-slate-800 text-white px-6 py-3 rounded-lg font-mono hover:bg-slate-700 transition-colors border border-slate-700"
      >
        Test Database Connection
      </button>
    </div>
  )
}

export default App