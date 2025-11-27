import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { InfoIcon } from "lucide-react";

interface Column {
  name: string;
  required: boolean;
  description: string;
  example: string;
}

interface DataFormatModalProps {
  title: string;
  description: string;
  columns: Column[];
  exampleData?: string[][];
}

export function DataFormatModal({
  title,
  description,
  columns,
  exampleData,
}: DataFormatModalProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center justify-center rounded-md p-2 text-blue-600 hover:bg-blue-50 transition-colors"
          title="View data format"
        >
          <InfoIcon className="h-5 w-5" />
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-6">
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-3">
              Required Columns
            </h4>
            <div className="space-y-2">
              {columns.map((col, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 text-sm border-l-2 border-gray-200 pl-3 py-1"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <code className="px-2 py-0.5 bg-gray-100 rounded text-xs font-mono">
                        {col.name}
                      </code>
                      {col.required && (
                        <span className="text-xs text-red-600 font-medium">
                          Required
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 mt-1">{col.description}</p>
                    <p className="text-gray-500 text-xs mt-1">
                      Example: <span className="font-medium">{col.example}</span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {exampleData && (
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-3">
                Example Data Format
              </h4>
              <div className="overflow-x-auto">
                <table className="min-w-full border border-gray-300 text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      {columns.map((col, idx) => (
                        <th
                          key={idx}
                          className="px-4 py-2 text-left font-medium text-gray-700 border-b border-gray-300"
                        >
                          {col.name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {exampleData.map((row, rowIdx) => (
                      <tr
                        key={rowIdx}
                        className={rowIdx % 2 === 0 ? "bg-white" : "bg-gray-50"}
                      >
                        {row.map((cell, cellIdx) => (
                          <td
                            key={cellIdx}
                            className="px-4 py-2 border-b border-gray-200 text-gray-900"
                          >
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-blue-900 mb-2">
              Important Notes
            </h4>
            <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
              <li>File must be in Excel format (.xlsx or .xls)</li>
              <li>Column names are case-insensitive</li>
              <li>Empty rows will be skipped</li>
              <li>Duplicate entries will be reported as errors</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

