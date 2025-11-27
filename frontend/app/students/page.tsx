"use client";

import { useEffect, useState } from "react";
import Header from "@/components/Header";
import Card from "@/components/Card";
import Button from "@/components/Button";
import { DataFormatModal } from "@/components/DataFormatModal";
import { API_URL } from "@/lib/config";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Branch {
  id: string;
  branch_name: string;
}

interface Student {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  branch_id: string;
  semester?: number;
  created_at: string;
}

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [formData, setFormData] = useState({
    id: "",
    name: "",
    email: "",
    phone: "",
    branch_id: "",
    semester: "",
  });
  const [bulkFile, setBulkFile] = useState<File | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [studentsRes, branchesRes] = await Promise.all([
        fetch(`${API_URL}/students`),
        fetch(`${API_URL}/branches`),
      ]);

      if (studentsRes.ok) {
        const studentsData = await studentsRes.json();
        setStudents(studentsData);
      }
      if (branchesRes.ok) {
        const branchesData = await branchesRes.json();
        setBranches(branchesData);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        branch_id: formData.branch_id,
        semester: formData.semester ? parseInt(formData.semester) : undefined,
      };

      const response = await fetch(`${API_URL}/students/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        setFormData({
          id: "",
          name: "",
          email: "",
          phone: "",
          branch_id: "",
          semester: "",
        });
        setShowForm(false);
        fetchData();
      } else {
        const error = await response.json();
        alert(error.detail || "Failed to create student");
      }
    } catch (error) {
      console.error("Error creating student:", error);
      alert("Failed to create student");
    }
  };

  const handleBulkUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkFile) {
      alert("Please select a file");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("file", bulkFile);

      const response = await fetch(`${API_URL}/students/bulk-upload`, {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        alert(result.message);
        setBulkFile(null);
        setShowBulkUpload(false);
        fetchData();
      } else {
        const error = await response.json();
        alert(error.detail || "Failed to upload students");
      }
    } catch (error) {
      console.error("Error uploading students:", error);
      alert("Failed to upload students");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this student?")) return;

    try {
      const response = await fetch(`${API_URL}/students/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchData();
      } else {
        const error = await response.json();
        alert(error.detail || "Failed to delete student");
      }
    } catch (error) {
      console.error("Error deleting student:", error);
      alert("Failed to delete student");
    }
  };

  const getBranchName = (branchId: string) => {
    const branch = branches.find((b) => b.id === branchId);
    return branch ? branch.id : "Unknown";
  };

  return (
    <div>
      <Header
        title="Students Management"
        description="Manage student records and information"
      />

      <div className="px-8 py-6">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            All Students ({students.length})
          </h2>
          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={() => setShowBulkUpload(!showBulkUpload)}
            >
              Bulk Upload
            </Button>
            <Button onClick={() => setShowForm(!showForm)}>
              {showForm ? "Cancel" : "+ Add Student"}
            </Button>
          </div>
        </div>

        {showForm && (
          <Card className="mb-6 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Add New Student
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Student ID *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.id}
                    onChange={(e) =>
                      setFormData({ ...formData, id: e.target.value })
                    }
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Branch *
                  </label>
                  <Select
                    value={formData.branch_id}
                    onValueChange={(value) =>
                      setFormData({ ...formData, branch_id: value })
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select Branch" />
                    </SelectTrigger>
                    <SelectContent>
                      {branches.map((branch) => (
                        <SelectItem key={branch.id} value={branch.id}>
                          {branch.branch_name} ({branch.id})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Semester
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={formData.semester}
                    onChange={(e) =>
                      setFormData({ ...formData, semester: e.target.value })
                    }
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <Button type="submit">Create Student</Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </Card>
        )}

        {showBulkUpload && (
          <Card className="mb-6 p-6">
            <div className="flex items-center gap-2 mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Bulk Upload Students
              </h3>
              <DataFormatModal
                title="Student Data Format"
                description="Upload a CSV or Excel file with the following columns to bulk add students"
                columns={[
                  {
                    name: "id",
                    required: true,
                    description: "Unique student ID",
                    example: "21BCS101",
                  },
                  {
                    name: "branch",
                    required: true,
                    description: "Branch code (e.g., CSE, ECE, ME)",
                    example: "CSE",
                  },
                  {
                    name: "name",
                    required: false,
                    description: "Full name of the student",
                    example: "John Doe",
                  },
                  {
                    name: "email",
                    required: false,
                    description: "Student's email address",
                    example: "john.doe@example.com",
                  },
                  {
                    name: "phone",
                    required: false,
                    description: "Contact phone number",
                    example: "9876543210",
                  },
                  {
                    name: "semester",
                    required: false,
                    description: "Current semester (1-10)",
                    example: "4",
                  },
                ]}
                exampleData={[
                  [
                    "21BCS101",
                    "CSE",
                    "John Doe",
                    "john@example.com",
                    "9876543210",
                    "4",
                  ],
                  [
                    "21BCS102",
                    "CSE",
                    "Jane Smith",
                    "jane@example.com",
                    "9876543211",
                    "4",
                  ],
                  [
                    "21ECE101",
                    "ECE",
                    "Bob Johnson",
                    "bob@example.com",
                    "9876543212",
                    "3",
                  ],
                ]}
              />
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Upload a CSV or Excel file (.csv, .xlsx, .xls) with student data.
              Click the info icon above to see the expected format.
            </p>
            <form onSubmit={handleBulkUpload} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select File *
                </label>
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  required
                  onChange={(e) => setBulkFile(e.target.files?.[0] || null)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="flex gap-3">
                <Button type="submit">Upload Students</Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setShowBulkUpload(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </Card>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-r-transparent"></div>
          </div>
        ) : students.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-gray-500">No students found</p>
            <p className="mt-2 text-sm text-gray-400">
              Add your first student to get started
            </p>
          </Card>
        ) : (
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Student ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Branch
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Semester
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {students.map((student) => (
                    <tr key={student.id} className="hover:bg-gray-50">
                      <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                        {student.id}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                        {student.name || "-"}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                        {student.email || "-"}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                        <span className="inline-flex rounded-full bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-800">
                          {getBranchName(student.branch_id)}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                        {student.semester || "-"}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                        <button
                          onClick={() => handleDelete(student.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
