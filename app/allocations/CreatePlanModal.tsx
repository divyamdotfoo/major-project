"use client";

import { useState, useEffect } from "react";
import Button from "@/components/Button";
import { API_URL } from "@/lib/config";
import {
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface CreatePlanModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

interface Student {
  id: string;
  name: string;
  branch_id: string;
  semester: number | null;
}

interface Room {
  id: string;
  rows: number;
  cols: number;
}

interface Subject {
  id: string;
  name: string;
}

interface Branch {
  id: string;
  branch_name: string;
}

export default function CreatePlanModal({
  onClose,
  onSuccess,
}: CreatePlanModalProps) {
  const [step, setStep] = useState<"method" | "existing" | "import">("method");
  const [formData, setFormData] = useState({
    name: "",
    exam_date: "",
    description: "",
  });

  // For existing data
  const [students, setStudents] = useState<Student[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);

  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [selectedRooms, setSelectedRooms] = useState<string[]>([]);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [selectedBranches, setSelectedBranches] = useState<string[]>([]);

  const [studentSearch, setStudentSearch] = useState("");
  const [roomSearch, setRoomSearch] = useState("");
  const [subjectSearch, setSubjectSearch] = useState("");
  const [branchSearch, setBranchSearch] = useState("");

  // For import data
  const [studentsFile, setStudentsFile] = useState<File | null>(null);
  const [roomsFile, setRoomsFile] = useState<File | null>(null);
  const [parsedStudents, setParsedStudents] = useState<any[]>([]);
  const [parsedRooms, setParsedRooms] = useState<any[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (step === "existing") {
      fetchExistingData();
    }
  }, [step]);

  const fetchExistingData = async () => {
    try {
      const [studentsRes, roomsRes, subjectsRes, branchesRes] =
        await Promise.all([
          fetch(`${API_URL}/students/`),
          fetch(`${API_URL}/rooms/`),
          fetch(`${API_URL}/subjects/`),
          fetch(`${API_URL}/branches/`),
        ]);

      if (studentsRes.ok) setStudents(await studentsRes.json());
      if (roomsRes.ok) setRooms(await roomsRes.json());
      if (subjectsRes.ok) setSubjects(await subjectsRes.json());
      if (branchesRes.ok) setBranches(await branchesRes.json());
    } catch (error) {
      console.error("Error fetching data:", error);
      setError("Failed to fetch existing data");
    }
  };

  const handleFileUpload = async (file: File, type: "students" | "rooms") => {
    try {
      const formData = new FormData();
      formData.append("file", file);

      const endpoint =
        type === "students"
          ? "/seating-plans/upload-students-xlsx"
          : "/seating-plans/upload-rooms-xlsx";

      const response = await fetch(`${API_URL}${endpoint}`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Failed to parse file");
      }

      const data = await response.json();

      if (type === "students") {
        setParsedStudents(data.students);
      } else {
        setParsedRooms(data.rooms);
      }
    } catch (error: any) {
      setError(error.message);
    }
  };

  const handleCreateFromExisting = async () => {
    if (!formData.name) {
      setError("Please enter a plan name");
      return;
    }

    if (selectedStudents.length === 0) {
      setError("Please select at least one student");
      return;
    }

    if (selectedRooms.length === 0) {
      setError("Please select at least one room");
      return;
    }

    if (selectedSubjects.length === 0) {
      setError("Please select at least one subject");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `${API_URL}/seating-plans/create-from-existing`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formData.name,
            exam_date: formData.exam_date || null,
            description: formData.description || null,
            student_ids: selectedStudents,
            room_ids: selectedRooms,
            subject_ids: selectedSubjects,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Failed to create plan");
      }

      onSuccess();
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFromImport = async () => {
    if (!formData.name) {
      setError("Please enter a plan name");
      return;
    }

    if (parsedStudents.length === 0 || parsedRooms.length === 0) {
      setError("Please upload both students and rooms files");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `${API_URL}/seating-plans/create-from-import`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formData.name,
            exam_date: formData.exam_date || null,
            description: formData.description || null,
            students: parsedStudents,
            rooms: parsedRooms,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Failed to create plan");
      }

      onSuccess();
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleSelection = (
    id: string,
    list: string[],
    setter: (list: string[]) => void
  ) => {
    if (list.includes(id)) {
      setter(list.filter((item) => item !== id));
    } else {
      setter([...list, id]);
    }
  };

  const selectStudentsByBranch = (branchId: string) => {
    const branchStudentIds = students
      .filter((s) => s.branch_id === branchId)
      .map((s) => s.id);

    // Toggle: if all are selected, deselect them; otherwise select all
    const allSelected = branchStudentIds.every((id) =>
      selectedStudents.includes(id)
    );

    if (allSelected) {
      setSelectedStudents(
        selectedStudents.filter((id) => !branchStudentIds.includes(id))
      );
    } else {
      const newSelection = [
        ...new Set([...selectedStudents, ...branchStudentIds]),
      ];
      setSelectedStudents(newSelection);
    }
  };

  const selectStudentsBySemester = (semester: number) => {
    const semesterStudentIds = students
      .filter((s) => s.semester === semester)
      .map((s) => s.id);

    // Toggle: if all are selected, deselect them; otherwise select all
    const allSelected = semesterStudentIds.every((id) =>
      selectedStudents.includes(id)
    );

    if (allSelected) {
      setSelectedStudents(
        selectedStudents.filter((id) => !semesterStudentIds.includes(id))
      );
    } else {
      const newSelection = [
        ...new Set([...selectedStudents, ...semesterStudentIds]),
      ];
      setSelectedStudents(newSelection);
    }
  };

  const getBranchName = (branchId: string) => {
    const branch = branches.find((b) => b.id === branchId);
    return branch ? branch.branch_name : branchId;
  };

  const getUniqueSemesters = () => {
    const semesters = students
      .map((s) => s.semester)
      .filter((sem): sem is number => sem !== null);
    return [...new Set(semesters)].sort((a, b) => a - b);
  };

  const filteredStudents = students.filter(
    (s) =>
      s.id.toLowerCase().includes(studentSearch.toLowerCase()) ||
      s.name?.toLowerCase().includes(studentSearch.toLowerCase())
  );

  const filteredRooms = rooms.filter((r) =>
    r.id.toLowerCase().includes(roomSearch.toLowerCase())
  );

  const filteredSubjects = subjects.filter(
    (s) =>
      s.name.toLowerCase().includes(subjectSearch.toLowerCase()) ||
      s.id.toLowerCase().includes(subjectSearch.toLowerCase())
  );

  const filteredBranches = branches.filter(
    (b) =>
      b.branch_name.toLowerCase().includes(branchSearch.toLowerCase()) ||
      b.id.toLowerCase().includes(branchSearch.toLowerCase())
  );

  return (
    <DialogContent className="md:max-w-4xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="text-2xl">Create Seating Plan</DialogTitle>
        <DialogDescription>
          Create a new exam seating allocation plan from existing data or import
          new data.
        </DialogDescription>
      </DialogHeader>

      <div className="mt-4">
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded text-red-700">
            {error}
          </div>
        )}

        {step === "method" && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Plan Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter plan name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Exam Date
              </label>
              <input
                type="text"
                value={formData.exam_date}
                onChange={(e) =>
                  setFormData({ ...formData, exam_date: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., 27th Nov 2025"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Optional description"
              />
            </div>

            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold mb-4">Choose Data Source</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={() => setStep("existing")}
                  className="p-6 border-2 border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-left"
                >
                  <div className="flex items-start gap-3">
                    <svg
                      className="w-8 h-8 text-blue-600 shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4"
                      />
                    </svg>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">
                        Use Existing Data
                      </h4>
                      <p className="text-sm text-gray-600">
                        Select from students, rooms, and subjects already in the
                        database
                      </p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => setStep("import")}
                  className="p-6 border-2 border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors text-left"
                >
                  <div className="flex items-start gap-3">
                    <svg
                      className="w-8 h-8 text-green-600 shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                      />
                    </svg>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">
                        Import New Data
                      </h4>
                      <p className="text-sm text-gray-600">
                        Upload Excel files with student and room information
                      </p>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}

        {step === "existing" && (
          <div className="space-y-6">
            <Button variant="secondary" onClick={() => setStep("method")}>
              Back
            </Button>

            <div>
              <h3 className="text-lg font-semibold mb-3">Select Students</h3>

              <div className="mb-4 p-4 bg-gray-50 rounded-md space-y-3">
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    Quick Select by Branch:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {branches.map((branch) => {
                      const branchStudentCount = students.filter(
                        (s) => s.branch_id === branch.id
                      ).length;
                      const branchStudentIds = students
                        .filter((s) => s.branch_id === branch.id)
                        .map((s) => s.id);
                      const allSelected =
                        branchStudentIds.length > 0 &&
                        branchStudentIds.every((id) =>
                          selectedStudents.includes(id)
                        );

                      return (
                        <button
                          key={branch.id}
                          onClick={() => selectStudentsByBranch(branch.id)}
                          className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                            allSelected
                              ? "bg-blue-600 text-white border-blue-600"
                              : "bg-white text-gray-700 border-gray-300 hover:border-blue-500"
                          }`}
                        >
                          {branch.branch_name} ({branchStudentCount})
                        </button>
                      );
                    })}
                  </div>
                </div>

                {getUniqueSemesters().length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">
                      Quick Select by Semester:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {getUniqueSemesters().map((semester) => {
                        const semesterStudentCount = students.filter(
                          (s) => s.semester === semester
                        ).length;
                        const semesterStudentIds = students
                          .filter((s) => s.semester === semester)
                          .map((s) => s.id);
                        const allSelected =
                          semesterStudentIds.length > 0 &&
                          semesterStudentIds.every((id) =>
                            selectedStudents.includes(id)
                          );

                        return (
                          <button
                            key={semester}
                            onClick={() => selectStudentsBySemester(semester)}
                            className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                              allSelected
                                ? "bg-green-600 text-white border-green-600"
                                : "bg-white text-gray-700 border-gray-300 hover:border-green-500"
                            }`}
                          >
                            Semester {semester} ({semesterStudentCount})
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <input
                type="text"
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                placeholder="Search students by name or ID..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md mb-3"
              />
              <div className="border border-gray-300 rounded-md max-h-60 overflow-y-auto">
                {filteredStudents.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    No students found
                  </div>
                ) : (
                  filteredStudents.map((student) => (
                    <label
                      key={student.id}
                      className="flex items-center p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                    >
                      <input
                        type="checkbox"
                        checked={selectedStudents.includes(student.id)}
                        onChange={() =>
                          toggleSelection(
                            student.id,
                            selectedStudents,
                            setSelectedStudents
                          )
                        }
                        className="mr-3"
                      />
                      <div className="flex-1">
                        <div className="font-medium">{student.id}</div>
                        <div className="flex gap-2 items-center text-sm text-gray-600">
                          {student.name && <span>{student.name}</span>}
                          <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-800 rounded">
                            {getBranchName(student.branch_id)}
                          </span>
                          {student.semester && (
                            <span className="text-xs px-2 py-0.5 bg-green-100 text-green-800 rounded">
                              Sem {student.semester}
                            </span>
                          )}
                        </div>
                      </div>
                    </label>
                  ))
                )}
              </div>
              <div className="mt-2 text-sm text-gray-600">
                {selectedStudents.length} student(s) selected
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">Select Rooms</h3>
              <input
                type="text"
                value={roomSearch}
                onChange={(e) => setRoomSearch(e.target.value)}
                placeholder="Search rooms..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md mb-3"
              />
              <div className="border border-gray-300 rounded-md max-h-60 overflow-y-auto">
                {filteredRooms.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    No rooms found
                  </div>
                ) : (
                  filteredRooms.map((room) => (
                    <label
                      key={room.id}
                      className="flex items-center p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                    >
                      <input
                        type="checkbox"
                        checked={selectedRooms.includes(room.id)}
                        onChange={() =>
                          toggleSelection(
                            room.id,
                            selectedRooms,
                            setSelectedRooms
                          )
                        }
                        className="mr-3"
                      />
                      <div>
                        <div className="font-medium">{room.id}</div>
                        <div className="text-sm text-gray-600">
                          {room.rows} rows × {room.cols} cols
                        </div>
                      </div>
                    </label>
                  ))
                )}
              </div>
              <div className="mt-2 text-sm text-gray-600">
                {selectedRooms.length} room(s) selected
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">Select Subjects</h3>
              <input
                type="text"
                value={subjectSearch}
                onChange={(e) => setSubjectSearch(e.target.value)}
                placeholder="Search subjects..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md mb-3"
              />
              <div className="border border-gray-300 rounded-md max-h-60 overflow-y-auto">
                {filteredSubjects.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    No subjects found
                  </div>
                ) : (
                  filteredSubjects.map((subject) => (
                    <label
                      key={subject.id}
                      className="flex items-center p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                    >
                      <input
                        type="checkbox"
                        checked={selectedSubjects.includes(subject.id)}
                        onChange={() =>
                          toggleSelection(
                            subject.id,
                            selectedSubjects,
                            setSelectedSubjects
                          )
                        }
                        className="mr-3"
                      />
                      <div>
                        <div className="font-medium">{subject.name}</div>
                        <div className="text-sm text-gray-600">
                          {subject.id}
                        </div>
                      </div>
                    </label>
                  ))
                )}
              </div>
              <div className="mt-2 text-sm text-gray-600">
                {selectedSubjects.length} subject(s) selected
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handleCreateFromExisting}
                disabled={loading}
                className="flex-1"
              >
                {loading ? "Creating..." : "Create Plan"}
              </Button>
            </div>
          </div>
        )}

        {step === "import" && (
          <div className="space-y-6">
            <Button variant="secondary" onClick={() => setStep("method")}>
              Back
            </Button>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2">
                File Format Requirements
              </h4>
              <div className="text-sm text-blue-800 space-y-2">
                <p>
                  <strong>Accepted formats:</strong> CSV (.csv) or Excel (.xlsx,
                  .xls)
                </p>
                <p>
                  <strong>Students file:</strong> Must contain columns: roll_no,
                  branch, subject
                </p>
                <p>
                  <strong>Rooms file:</strong> Must contain columns: room_id,
                  rows, cols
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">
                Upload Students File
              </h3>
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setStudentsFile(file);
                    handleFileUpload(file, "students");
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
              {parsedStudents.length > 0 && (
                <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded">
                  <p className="text-green-800">
                    Successfully parsed {parsedStudents.length} students
                  </p>
                </div>
              )}
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">Upload Rooms File</h3>
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setRoomsFile(file);
                    handleFileUpload(file, "rooms");
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
              {parsedRooms.length > 0 && (
                <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded">
                  <p className="text-green-800">
                    Successfully parsed {parsedRooms.length} rooms
                  </p>
                </div>
              )}
            </div>

            {parsedStudents.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3">
                  Preview Students (first 5)
                </h3>
                <div className="border border-gray-300 rounded-md overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left">Roll No</th>
                        <th className="px-4 py-2 text-left">Branch</th>
                        <th className="px-4 py-2 text-left">Subject</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parsedStudents.slice(0, 5).map((student, idx) => (
                        <tr key={idx} className="border-t">
                          <td className="px-4 py-2">{student.roll_no}</td>
                          <td className="px-4 py-2">{student.branch}</td>
                          <td className="px-4 py-2">{student.subject}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {parsedRooms.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3">
                  Preview Rooms (first 5)
                </h3>
                <div className="border border-gray-300 rounded-md overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left">Room ID</th>
                        <th className="px-4 py-2 text-left">Rows</th>
                        <th className="px-4 py-2 text-left">Cols</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parsedRooms.slice(0, 5).map((room, idx) => (
                        <tr key={idx} className="border-t">
                          <td className="px-4 py-2">{room.room_id}</td>
                          <td className="px-4 py-2">{room.rows}</td>
                          <td className="px-4 py-2">{room.cols}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <Button
                onClick={handleCreateFromImport}
                disabled={loading}
                className="flex-1"
              >
                {loading ? "Creating..." : "Create Plan"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </DialogContent>
  );
}
