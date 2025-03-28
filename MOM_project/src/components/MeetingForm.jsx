
// import React, { useState } from "react";
// import "./styles.css";
// import axios from "axios";
// import toast from "react-hot-toast";

// const MeetingForm = () => {
//   const [transcriptFile, setTranscriptFile] = useState(null);
//   const [meetingTitle, setMeetingTitle] = useState(""); // Meeting title
//   const [emailInput, setEmailInput] = useState("");
//   const [emails, setEmails] = useState([]);
//   // New state for actual speaker names as an array of objects
//   const [speakerEntries, setSpeakerEntries] = useState([
//     { speaker: "", actualName: "" }
//   ]);

//   const isValidEmail = (email) => {
//     return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email);
//   };

//   const handleFileChange = (e) => {
//     const file = e.target.files[0];
//     if (file) {
//       setTranscriptFile(file);
//     }
//   };

//   const handleEmailChange = (e) => {
//     setEmailInput(e.target.value);
//   };

//   const handleMeetingTitleChange = (e) => {
//     setMeetingTitle(e.target.value);
//   };

//   // Update speaker entry fields
//   const handleSpeakerEntryChange = (index, field, value) => {
//     const newEntries = [...speakerEntries];
//     newEntries[index][field] = value;
//     setSpeakerEntries(newEntries);
//   };

//   // Add a new speaker entry row
//   const addSpeakerEntry = () => {
//     setSpeakerEntries([...speakerEntries, { speaker: "", actualName: "" }]);
//   };

//   // Remove a speaker entry row
//   const removeSpeakerEntry = (index) => {
//     setSpeakerEntries(speakerEntries.filter((_, i) => i !== index));
//   };

//   const addEmail = () => {
//     const trimmedEmail = emailInput.trim();
//     if (!isValidEmail(trimmedEmail)) {
//       toast.error("Please enter a valid email.");
//       return;
//     }
//     if (emails.includes(trimmedEmail)) {
//       toast.error("This email is already added.");
//       return;
//     }
//     setEmails([...emails, trimmedEmail]);
//     setEmailInput("");
//   };

//   const removeEmail = (index) => {
//     setEmails(emails.filter((_, i) => i !== index));
//   };

//   const handleGenerateMOM = async () => {
//     try {
//       if (!transcriptFile) {
//         toast.error("Please upload a transcript file.");
//         return;
//       }
//       if (!meetingTitle.trim()) {
//         toast.error("Please enter a meeting title.");
//         return;
//       }
//       if (emails.length === 0) {
//         toast.error("Please enter at least one email.");
//         return;
//       }

//       // Convert speakerEntries array into an object
//       // Example: { "SPEAKER-0": "Kiran", "SPEAKER-1": "Manish" }
//       const actualNamesObj = {};
//       speakerEntries.forEach((entry) => {
//         if (entry.speaker.trim() && entry.actualName.trim()) {
//           actualNamesObj[entry.speaker.trim()] = entry.actualName.trim();
//         }
//       });

//       const formData = new FormData();
//       formData.append("transcriptFile", transcriptFile);
//       formData.append("meetingTitle", meetingTitle);
//       formData.append("emails", JSON.stringify(emails));
//       // Append actualNames as JSON string if available
//       if (Object.keys(actualNamesObj).length > 0) {
//         formData.append("actualNames", JSON.stringify(actualNamesObj));
//       }

//       console.log("Sending FormData:", {
//         transcriptFile,
//         meetingTitle,
//         emails,
//         actualNames: actualNamesObj,
//       });

//       const response1 = await axios.post(
//         "http://localhost:3000/api/teams/getTransScript",
//         formData,
//         {
//           headers: { "Content-Type": "multipart/form-data" },
//         }
//       );

//       // Clear form fields after success.
//       setTranscriptFile(null);
//       setMeetingTitle("");
//       setEmails([]);
//       setSpeakerEntries([{ speaker: "", actualName: "" }]);
//       toast.success("Request sent successfully");
//     } catch (error) {
//       console.error("Error Response:", error.response);
//       toast.error(
//         `Error: ${error.response?.data?.message || "Internal Server Error"}`
//       );
//     }
//   };

//   return (
//     <div className="container">
//       <div className="center-box">
//         <div className="header">MOM Generator</div>
//         <div className="form-container">
//           <input
//             type="text"
//             className="input-field"
//             placeholder="Enter Meeting Title"
//             value={meetingTitle}
//             onChange={handleMeetingTitleChange}
//           />

//           <input
//             type="file"
//             className="input-field"
//             accept=".doc,.docx"
//             onChange={handleFileChange}
//           />

//           <div className="email-container">
//             <input
//               type="text"
//               className="email-input"
//               placeholder="Enter email and click Add"
//               value={emailInput}
//               onChange={handleEmailChange}
//             />
//             <button className="add-email-btn" onClick={addEmail}>
//               Add Email
//             </button>
//           </div>

//           <div className="email-list">
//             {emails.map((email, index) => (
//               <div key={index} className="email-tag">
//                 {email}
//                 <span
//                   className="remove-btn"
//                   onClick={() => removeEmail(index)}
//                 >
//                   ×
//                 </span>
//               </div>
//             ))}
//           </div>

//           {/* Speaker Entries Section */}
//           <div>
//             <h3>Actual Speaker Names</h3>
//             {speakerEntries.map((entry, index) => (
//               <div key={index} style={{ display: "flex", gap: "0.5em" }}>
//                 <input
//                   type="text"
//                   placeholder='Speaker Label (e.g., "SPEAKER-0")'
//                   value={entry.speaker}
//                   onChange={(e) =>
//                     handleSpeakerEntryChange(index, "speaker", e.target.value)
//                   }
//                 />
//                 <input
//                   type="text"
//                   placeholder='Actual Name (e.g., "Kiran")'
//                   value={entry.actualName}
//                   onChange={(e) =>
//                     handleSpeakerEntryChange(index, "actualName", e.target.value)
//                   }
//                 />
//                 <button onClick={() => removeSpeakerEntry(index)}>Remove</button>
//               </div>
//             ))}
//             <button onClick={addSpeakerEntry}>Add Speaker</button>
//           </div>

//           <button className="generate-btn" onClick={handleGenerateMOM}>
//             Generate MOM
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default MeetingForm;
import React, { useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";

const MeetingForm = () => {
  const [transcriptFile, setTranscriptFile] = useState(null);
  const [meetingTitle, setMeetingTitle] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [emails, setEmails] = useState([]);
  const [speakerEntries, setSpeakerEntries] = useState([
    { speaker: "", actualName: "" }
  ]);

  const isValidEmail = (email) => {
    return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email);
  };

  const handleFileChange = (e) => {
    setTranscriptFile(e.target.files[0]);
  };

  const handleMeetingTitleChange = (e) => {
    setMeetingTitle(e.target.value);
  };

  const handleEmailChange = (e) => {
    setEmailInput(e.target.value);
  };

  const addEmail = () => {
    const trimmedEmail = emailInput.trim();
    if (!isValidEmail(trimmedEmail)) {
      toast.error("Please enter a valid email.");
      return;
    }
    if (emails.includes(trimmedEmail)) {
      toast.error("This email is already added.");
      return;
    }
    setEmails([...emails, trimmedEmail]);
    setEmailInput("");
  };

  const removeEmail = (index) => {
    setEmails(emails.filter((_, i) => i !== index));
  };

  const handleSpeakerEntryChange = (index, field, value) => {
    const newEntries = [...speakerEntries];
    newEntries[index][field] = value;
    setSpeakerEntries(newEntries);
  };

  const addSpeakerEntry = () => {
    setSpeakerEntries([...speakerEntries, { speaker: "", actualName: "" }]);
  };

  const removeSpeakerEntry = (index) => {
    setSpeakerEntries(speakerEntries.filter((_, i) => i !== index));
  };

  const handleGenerateMOM = async () => {
    try {
      if (!transcriptFile || !meetingTitle.trim() || emails.length === 0) {
        toast.error("Please complete all required fields.");
        return;
      }

      const actualNamesObj = {};
      speakerEntries.forEach((entry) => {
        if (entry.speaker.trim() && entry.actualName.trim()) {
          actualNamesObj[entry.speaker.trim()] = entry.actualName.trim();
        }
      });

      const formData = new FormData();
      formData.append("transcriptFile", transcriptFile);
      formData.append("meetingTitle", meetingTitle);
      formData.append("emails", JSON.stringify(emails));
      if (Object.keys(actualNamesObj).length > 0) {
        formData.append("actualNames", JSON.stringify(actualNamesObj));
      }

      await axios.post("http://localhost:3000/api/teams/getTransScript", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      setTranscriptFile(null);
      setMeetingTitle("");
      setEmails([]);
      setSpeakerEntries([{ speaker: "", actualName: "" }]);
      toast.success("Request sent successfully");
    } catch (error) {
      toast.error(`Error: ${error.response?.data?.message || "Internal Server Error"}`);
    }
  };

  return (
    <div className="max-w-lg mx-auto p-6 bg-white shadow-lg rounded-xl">
      <h2 className="text-2xl font-semibold text-gray-700 text-center mb-4">MOM Generator</h2>
      <input
        type="text"
        className="w-full p-2 border rounded mb-4"
        placeholder="Enter Meeting Title"
        value={meetingTitle}
        onChange={handleMeetingTitleChange}
      />
      <input
        type="file"
        className="w-full p-2 border rounded mb-4"
        accept=".doc,.docx"
        onChange={handleFileChange}
      />
      <div className="mb-4">
        <input
          type="text"
          className="w-full p-2 border rounded"
          placeholder="Enter email and click Add"
          value={emailInput}
          onChange={handleEmailChange}
        />
        <button className="mt-2 w-full bg-blue-500 text-white p-2 rounded" onClick={addEmail}>
          Add Email
        </button>
      </div>
      <div className="mb-4">
        {emails.map((email, index) => (
          <div key={index} className="flex justify-between p-2 bg-gray-100 rounded mb-2">
            <span>{email}</span>
            <button className="text-red-500" onClick={() => removeEmail(index)}>×</button>
          </div>
        ))}
      </div>
      <div className="mb-4">
        <h3 className="text-lg font-medium">Actual Speaker Names</h3>
        {speakerEntries.map((entry, index) => (
          <div key={index} className="flex space-x-2 mt-2">
            <input
              type="text"
              className="w-1/2 p-2 border rounded"
              placeholder="Speaker Label"
              value={entry.speaker}
              onChange={(e) => handleSpeakerEntryChange(index, "speaker", e.target.value)}
            />
            <input
              type="text"
              className="w-1/2 p-2 border rounded"
              placeholder="Actual Name"
              value={entry.actualName}
              onChange={(e) => handleSpeakerEntryChange(index, "actualName", e.target.value)}
            />
            <button className="text-red-500" onClick={() => removeSpeakerEntry(index)}>×</button>
          </div>
        ))}
        <button className="mt-2 w-full bg-green-500 text-white p-2 rounded" onClick={addSpeakerEntry}>
          Add Speaker
        </button>
      </div>
      <button className="w-full bg-blue-600 text-white p-3 rounded font-semibold" onClick={handleGenerateMOM}>
        Generate MOM
      </button>
    </div>
  );
};

export default MeetingForm;
