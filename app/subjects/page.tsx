"use client";

import { useEffect, useState } from "react";
import Header from "@/components/Header";
import Card from "@/components/Card";
import Button from "@/components/Button";
import { DataFormatModal } from "@/components/DataFormatModal";
import { API_URL } from "@/lib/config";

interface Subject {
  id: string;
  name: string;
  created_at: string;
}

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [formData, setFormData] = useState({
    id: "",
    name: "",
  });
  const [bulkFile, setBulkFile] = useState<File | null>(null);

  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/subjects`);
      if (response.ok) {
        const data = await response.json();
        setSubjects(data);
      }
    } catch (error) {
      console.error("Error fetching subjects:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_URL}/subjects/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setFormData({ id: "", name: "" });
        setShowForm(false);
        fetchSubjects();
      } else {
        const error = await response.json();
        alert(error.detail || "Failed to create subject");
      }
    } catch (error) {
      console.error("Error creating subject:", error);
      alert("Failed to create subject");
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

      const response = await fetch(`${API_URL}/subjects/bulk-upload`, {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        alert(result.message);
        setBulkFile(null);
        setShowBulkUpload(false);
        fetchSubjects();
      } else {
        const error = await response.json();
        alert(error.detail || "Failed to upload subjects");
      }
    } catch (error) {
      console.error("Error uploading subjects:", error);
      alert("Failed to upload subjects");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this subject?")) return;

    try {
      const response = await fetch(`${API_URL}/subjects/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchSubjects();
      } else {
        const error = await response.json();
        alert(error.detail || "Failed to delete subject");
      }
    } catch (error) {
      console.error("Error deleting subject:", error);
      alert("Failed to delete subject");
    }
  };

  return (
    <div>
      <Header
        title="Subjects Management"
        description="Manage subjects for examination"
      />

      <div className="px-8 py-6">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            All Subjects ({subjects.length})
          </h2>
          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={() => {
                setShowBulkUpload(!showBulkUpload);
                setShowForm(false);
              }}
            >
              {showBulkUpload ? "Cancel" : "Bulk Upload"}
            </Button>
            <Button
              onClick={() => {
                setShowForm(!showForm);
                setShowBulkUpload(false);
              }}
            >
              {showForm ? "Cancel" : "+ Add Subject"}
            </Button>
          </div>
        </div>

        {showForm && (
          <Card className="mb-6 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Add New Subject
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subject ID *
                </label>
                <input
                  type="text"
                  required
                  value={formData.id}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      id: e.target.value.toUpperCase(),
                    })
                  }
                  placeholder="e.g., MATH101"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subject Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="e.g., Mathematics"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="flex gap-3">
                <Button type="submit">Create Subject</Button>
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
                Bulk Upload Subjects
              </h3>
              <DataFormatModal
                title="Subject Data Format"
                description="Upload a CSV or Excel file with the following columns to bulk add subjects"
                columns={[
                  {
                    name: "id",
                    required: true,
                    description: "Unique subject ID or code",
                    example: "MATH101",
                  },
                  {
                    name: "name",
                    required: true,
                    description: "Full name of the subject",
                    example: "Mathematics I",
                  },
                ]}
                exampleData={[
                  ["MATH101", "Mathematics I"],
                  ["PHY101", "Physics I"],
                  ["CHEM101", "Chemistry I"],
                ]}
              />
            </div>

            <form onSubmit={handleBulkUpload} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Excel File *
                </label>
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={(e) => setBulkFile(e.target.files?.[0] || null)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <p className="mt-1 text-sm text-gray-500">
                  Supported formats: .xlsx, .xls
                </p>
              </div>

              <div className="flex gap-3">
                <Button type="submit" disabled={!bulkFile}>
                  Upload Subjects
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setShowBulkUpload(false);
                    setBulkFile(null);
                  }}
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
        ) : subjects.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-gray-500">No subjects found</p>
            <p className="mt-2 text-sm text-gray-400">
              Create your first subject to get started
            </p>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {subjects.map((subject) => (
              <Card key={subject.id} className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {subject.name}
                    </h3>
                    <span className="inline-block mt-1 rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800">
                      {subject.id}
                    </span>
                  </div>
                  <button
                    onClick={() => handleDelete(subject.id)}
                    className="text-gray-400 hover:text-red-600 transition-colors"
                  >
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <span className="text-xs text-gray-400">
                    {new Date(subject.created_at).toLocaleDateString()}
                  </span>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
