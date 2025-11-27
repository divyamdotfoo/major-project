"use client";

import { useEffect, useState } from "react";
import Header from "@/components/Header";
import Card from "@/components/Card";
import Button from "@/components/Button";
import { DataFormatModal } from "@/components/DataFormatModal";
import { API_URL } from "@/lib/config";

interface Branch {
  id: string;
  branch_name: string;
  description?: string;
  student_count?: number;
  created_at: string;
}

export default function BranchesPage() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [bulkUploadFile, setBulkUploadFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    branch_name: "",
    id: "",
    description: "",
  });

  useEffect(() => {
    fetchBranches();
  }, []);

  const fetchBranches = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/branches`);
      if (response.ok) {
        const data = await response.json();
        setBranches(data);
      }
    } catch (error) {
      console.error("Error fetching branches:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_URL}/branches/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setFormData({ branch_name: "", id: "", description: "" });
        setShowForm(false);
        fetchBranches();
      } else {
        const error = await response.json();
        alert(error.detail || "Failed to create branch");
      }
    } catch (error) {
      console.error("Error creating branch:", error);
      alert("Failed to create branch");
    }
  };

  const handleBulkUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkUploadFile) {
      alert("Please select a file");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("file", bulkUploadFile);

      const response = await fetch(`${API_URL}/branches/bulk-upload`, {
        method: "POST",
        body: formData,
      });

      const result = await response.json();
      if (response.ok) {
        alert(result.message);
        setShowBulkUpload(false);
        setBulkUploadFile(null);
        fetchBranches();
      } else {
        alert(result.detail || "Failed to upload file");
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      alert("Failed to upload file");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this branch?")) return;

    try {
      const response = await fetch(`${API_URL}/branches/${id}?force=true`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchBranches();
      } else {
        const error = await response.json();
        alert(error.detail || "Failed to delete branch");
      }
    } catch (error) {
      console.error("Error deleting branch:", error);
      alert("Failed to delete branch");
    }
  };

  return (
    <div>
      <Header
        title="Branches Management"
        description="Manage academic branches and departments"
      />

      <div className="px-8 py-6">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            All Branches ({branches.length})
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
              {showForm ? "Cancel" : "+ Add Branch"}
            </Button>
          </div>
        </div>

        {showForm && (
          <Card className="mb-6 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Add New Branch
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Branch Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.branch_name}
                  onChange={(e) =>
                    setFormData({ ...formData, branch_name: e.target.value })
                  }
                  placeholder="e.g., Computer Science Engineering"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Branch ID *
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
                  placeholder="e.g., CSE"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
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
                  placeholder="Optional description..."
                  rows={3}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="flex gap-3">
                <Button type="submit">Create Branch</Button>
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
                Bulk Upload Branches
              </h3>
              <DataFormatModal
                title="Branch Data Format"
                description="Upload a CSV or Excel file with the following columns to bulk add branches"
                columns={[
                  {
                    name: "id",
                    required: true,
                    description: "Unique branch code",
                    example: "CSE",
                  },
                  {
                    name: "branch_name",
                    required: true,
                    description: "Full name of the branch",
                    example: "Computer Science Engineering",
                  },
                  {
                    name: "description",
                    required: false,
                    description: "Optional description of the branch",
                    example: "Department of Computer Science",
                  },
                ]}
                exampleData={[
                  [
                    "CSE",
                    "Computer Science Engineering",
                    "Department of Computer Science",
                  ],
                  [
                    "ECE",
                    "Electronics and Communication Engineering",
                    "Department of ECE",
                  ],
                  ["ME", "Mechanical Engineering", "Department of Mechanical"],
                ]}
              />
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Upload a CSV or Excel file (.csv, .xlsx, .xls) with branch data.
              Click the info icon above to see the expected format.
            </p>
            <form onSubmit={handleBulkUpload} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select File *
                </label>
                <input
                  type="file"
                  required
                  accept=".xlsx,.xls,.csv"
                  onChange={(e) =>
                    setBulkUploadFile(e.target.files?.[0] || null)
                  }
                  className="w-full rounded-lg border border-gray-300 px-4 py-2"
                />
              </div>
              <div className="flex gap-3">
                <Button type="submit">Upload and Import</Button>
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
        ) : branches.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-gray-500">No branches found</p>
            <p className="mt-2 text-sm text-gray-400">
              Create your first branch to get started
            </p>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {branches.map((branch) => (
              <Card key={branch.id} className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {branch.branch_name}
                    </h3>
                    <span className="inline-block mt-1 rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800">
                      {branch.id}
                    </span>
                  </div>
                  <button
                    onClick={() => handleDelete(branch.id)}
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

                {branch.description && (
                  <p className="text-sm text-gray-600 mb-4">
                    {branch.description}
                  </p>
                )}

                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                      />
                    </svg>
                    <span>{branch.student_count || 0} students</span>
                  </div>
                  <span className="text-xs text-gray-400">
                    {new Date(branch.created_at).toLocaleDateString()}
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
