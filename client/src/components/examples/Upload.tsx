import { Upload } from '../upload'

export default function UploadExample() {
  return (
    <div className="p-4 space-y-4">
      <h3 className="text-lg font-semibold">Document Upload</h3>
      <div className="max-w-2xl">
        <Upload />
      </div>
    </div>
  )
}