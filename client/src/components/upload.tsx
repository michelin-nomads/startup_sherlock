import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FileUp, Upload as UploadIcon, X, CheckCircle, AlertCircle, Loader2, FileText, Image, File, Sparkles } from "lucide-react"
import { useMutation } from "@tanstack/react-query"
import { useToast } from "@/hooks/use-toast"
import { getApiUrl } from "@/lib/config"
import { useNavigate } from "react-router-dom"

interface UploadedFile {
  id: string
  name: string
  size: number
  type: string
  status: 'uploading' | 'processing' | 'completed' | 'error'
  progress: number
  extractedText?: string
  errorMessage?: string
}

const INDUSTRY_OPTIONS = [
  'AI/ML',
  'FinTech',
  'HealthTech',
  'SaaS',
  'E-commerce',
  'Cybersecurity',
  'Blockchain',
  'IoT',
  'Robotics',
  'CleanTech',
  'AgriTech',
  'EdTech',
  'Other'
]

export function Upload() {
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [startupName, setStartupName] = useState("")
  const [description, setDescription] = useState("")
  const [industry, setIndustry] = useState("")
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const { toast } = useToast()
  const navigate = useNavigate()

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    const droppedFiles = Array.from(e.dataTransfer.files)
    handleFileUpload(droppedFiles)
  }, [])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files)
      handleFileUpload(selectedFiles)
    }
  }

  const uploadMutation = useMutation({
    mutationFn: async ({ files, startupName, description, industry }: {
      files: File[],
      startupName: string,
      description: string,
      industry: string
    }) => {
      const formData = new FormData()
      files.forEach(file => {
        formData.append('documents', file)
      })
      formData.append('startupName', startupName)
      formData.append('description', description)
      formData.append('industry', industry)

      const response = await fetch(getApiUrl('/api/upload'), {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(errorText || 'Upload failed')
      }

      return response.json()
    },
    onSuccess: (data) => {
      toast({
        title: "Upload successful",
        description: `${data.uploadedDocuments.length} documents uploaded successfully. Ready for analysis.`
      })
      
      // Update files with backend response
      setFiles(prev => prev.map(file => {
        const uploaded = data.uploadedDocuments.find((d: any) => d.name === file.name)
        if (uploaded) {
          return {
            ...file,
            id: uploaded.id,
            status: 'completed' as const,
            progress: 100,
            extractedText: uploaded.extractedText
          }
        }
        return file
      }))
      
      // Store startup ID for analysis
      sessionStorage.setItem('currentStartupId', data.startupId)
      setIsUploading(false) // Hide popup when upload completes
    },
    onError: (error) => {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive"
      })
      
      setFiles(prev => prev.map(file => ({
        ...file,
        status: 'error' as const,
        errorMessage: error.message
      })))
      setIsUploading(false) // Hide popup when upload fails
    }
  })

  const handleFileUpload = (fileList: File[]) => {
    const newFiles: UploadedFile[] = fileList.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      size: file.size,
      type: file.type,
      status: 'uploading',
      progress: 0
    }))

    setFiles(prev => [...prev, ...newFiles])
    setIsUploading(true) // Show popup immediately

    // Start real upload (startupName is optional during upload)
    uploadMutation.mutate({
      files: fileList,
      startupName: startupName || '', // Allow empty startup name during upload
      description,
      industry
    })

    // Simulate progress for UI
    newFiles.forEach(file => {
      simulateUpload(file.id)
    })
  }

  const simulateUpload = (fileId: string) => {
    let progress = 0
    const interval = setInterval(() => {
      // Check if file has error status - stop progress if so
      setFiles(prev => {
        const currentFile = prev.find(f => f.id === fileId)
        if (currentFile?.status === 'error') {
          clearInterval(interval)
          return prev
        }
        return prev
      })

      // More granular progress increments for decimal display
      progress += Math.random() * 2.5 + 0.5 // Increment by 0.5-3.0
      
      setFiles(prev => prev.map(file => 
        file.id === fileId && file.status !== 'error'
          ? { 
              ...file, 
              progress: Math.min(progress, 90), // Don't complete via simulation
              status: progress >= 70 ? 'processing' : 'uploading'
            }
          : file
      ))

      if (progress >= 90) {
        clearInterval(interval)
      }
    }, 200) // Faster updates for smoother progress
  }

  const startAnalysis = async () => {
    // Validate startup name before starting analysis
    if (!startupName.trim()) {
      toast({
        title: "Startup name required",
        description: "Please enter a startup name before starting AI analysis",
        variant: "destructive"
      })
      return
    }

    // Validate industry before starting analysis
    if (!industry.trim()) {
      toast({
        title: "Industry required",
        description: "Please select an industry before starting AI analysis",
        variant: "destructive"
      })
      return
    }

    const startupId = sessionStorage.getItem('currentStartupId')
    if (!startupId) {
      toast({
        title: "Error",
        description: "No startup ID found. Please upload files first.",
        variant: "destructive"
      })
      return
    }

    setIsAnalyzing(true)
    
    try {
      console.log('🚀 Starting Document Analysis first, then Public Data Analysis')
      
      // Step 1: Document Analysis (must complete first to avoid race condition)
      // Start BOTH analyses in PARALLEL (not sequential!)
      console.log('📄 Starting document analysis...')
      console.log('🌐 Starting public data analysis in parallel...')
      
      const documentAnalysisPromise = fetch(getApiUrl(`/api/analyze/${startupId}`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          startupName: startupName.trim(),
          description: description.trim(),
          industry: industry.trim()
        })
      })

      const publicDataPromise = fetch(getApiUrl(`/api/public-data-analysis/${startupId}`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      // Wait for BOTH to complete in parallel using Promise.allSettled
      const [documentAnalysisResponse, publicDataResponse] = await Promise.allSettled([
        documentAnalysisPromise,
        publicDataPromise
      ])

      // Check document analysis response (critical - must succeed)
      if (documentAnalysisResponse.status === 'rejected' || !documentAnalysisResponse.value.ok) {
        throw new Error('Document analysis failed')
      }

      const documentResult = await documentAnalysisResponse.value.json()
      console.log('✅ Document analysis completed:', documentResult)
      
      // Check public data analysis (non-critical - can fail)
      let publicDataResult = null
      if (publicDataResponse.status === 'fulfilled' && publicDataResponse.value.ok) {
        publicDataResult = await publicDataResponse.value.json()
        console.log('✅ Public data analysis completed:', publicDataResult)
      } else {
        console.warn('⚠️ Public data analysis failed (non-critical), but continuing...')
      }
      
      toast({
        title: "Analysis complete",
        description: publicDataResult?.success 
          ? "Document and public data analysis completed successfully" 
          : "Document analysis completed (public data unavailable)"
      })

      // Navigate to results page
      navigate(`/analysis/${startupId}`)
      
      // Clear the form for next use
      setStartupName("")
      setDescription("")
      setFiles([])
    } catch (error) {
      console.error('❌ Analysis error:', error)
      toast({
        title: "Analysis failed",
        description: "Failed to complete AI analysis",
        variant: "destructive"
      })
    } finally {
      setIsAnalyzing(false)
    }
  }

  const removeFile = (fileId: string) => {
    console.log(`Removing file: ${fileId}`)
    setFiles(prev => prev.filter(file => file.id !== fileId))
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase()
    switch (extension) {
      case 'pdf':
        return <FileText className="h-5 w-5 text-red-500" />
      case 'docx':
      case 'doc':
        return <FileText className="h-5 w-5 text-blue-500" />
      case 'png':
      case 'jpg':
      case 'jpeg':
        return <Image className="h-5 w-5 text-green-500" />
      default:
        return <File className="h-5 w-5 text-muted-foreground" />
    }
  }

  const getStatusIcon = (status: UploadedFile['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      case 'processing':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
      default:
        return <UploadIcon className="h-4 w-4 text-blue-500" />
    }
  }

  const getStatusColor = (status: UploadedFile['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500/10 text-green-600 border-green-500/20'
      case 'error':
        return 'bg-red-500/10 text-red-600 border-red-500/20'
      case 'processing':
        return 'bg-blue-500/10 text-blue-600 border-blue-500/20'
      default:
        return 'bg-gray-500/10 text-gray-600 border-gray-500/20'
    }
  }

  return (
    <div className="space-y-0" data-testid="upload-main">
      {/* Header */}
      <div className="text-center space-y-4 mb-6">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight">AI Startup Analysis</h1>
        </div>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Upload your startup documents and get comprehensive AI-powered investment analysis in minutes
        </p>
      </div>

      {/* Startup Info Form */}
      <div className="card-modern p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            <FileText className="h-4 w-4 text-primary" />
          </div>
          <h2 className="text-xl font-semibold">Startup Information</h2>
        </div>
        <div className="space-y-6">
          <div className="space-y-3">
            <Label htmlFor="startup-name" className="text-sm font-medium">Startup Name *</Label>
            <Input
              id="startup-name"
              placeholder="Enter your startup name"
              value={startupName}
              onChange={(e) => setStartupName(e.target.value)}
              data-testid="input-startup-name"
              className="h-12"
            />
          </div>
          <div className="space-y-3">
            <Label htmlFor="industry" className="text-sm font-medium">Industry *</Label>
            <Select value={industry} onValueChange={setIndustry}>
              <SelectTrigger className="h-12">
                <SelectValue placeholder="Select your startup's industry" />
              </SelectTrigger>
              <SelectContent>
                {INDUSTRY_OPTIONS.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-3">
            <Label htmlFor="description" className="text-sm font-medium">Description (Optional)</Label>
            <Textarea
              id="description"
              placeholder="Brief description of your startup, business model, or key highlights..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              data-testid="textarea-description"
              className="min-h-[100px]"
            />
          </div>
        </div>
      </div>

      {/* File Upload Area */}
      <div className="card-modern p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            <FileUp className="h-4 w-4 text-primary" />
          </div>
          <h2 className="text-xl font-semibold">Upload Documents</h2>
        </div>
        
        <div
          className={`border-2 border-dashed rounded-xl p-12 text-center transition-all duration-200 ${
            isDragging 
              ? 'border-primary bg-primary/5 scale-[1.02]' 
              : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-primary/5'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          data-testid="upload-dropzone"
        >
          <div className="flex flex-col items-center space-y-4">
            <div className={`p-4 rounded-full transition-colors ${
              isDragging ? 'bg-primary/10' : 'bg-muted/50'
            }`}>
              <FileUp className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-semibold">
                {isDragging ? 'Drop files here' : 'Drag & drop your files'}
              </h3>
              <p className="text-muted-foreground">
                Supports PDF, DOCX, TXT, images, and more • Max 10MB per file
              </p>
            </div>
            <div className="flex items-center gap-4 pt-4">
              <Button asChild className="button-modern" data-testid="button-browse-files">
                <label>
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.docx,.txt,.png,.jpg,.jpeg"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <FileUp className="mr-2 h-4 w-4" />
                  Browse Files
                </label>
              </Button>
              <div className="text-sm text-muted-foreground">
                or drag and drop
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Uploaded Files */}
      {files.length > 0 && (
        <div className="card-modern p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <FileText className="h-4 w-4 text-primary" />
            </div>
            <h2 className="text-xl font-semibold">Uploaded Files ({files.length})</h2>
          </div>
          
          <div className="space-y-4">
            {files.map((file) => (
              <div 
                key={file.id} 
                className="flex items-center gap-4 p-4 border rounded-xl hover:bg-muted/30 transition-colors"
                data-testid={`file-item-${file.id}`}
              >
                <div className="flex-shrink-0">
                  {getFileIcon(file.name)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium truncate text-foreground">{file.name}</p>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(file.status)}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeFile(file.id)}
                        data-testid={`button-remove-${file.id}`}
                        className="h-8 w-8"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm mb-3">
                    <span className="text-muted-foreground">{formatFileSize(file.size)}</span>
                    <Badge 
                      variant="outline"
                      className={`text-xs font-medium ${getStatusColor(file.status)}`}
                    >
                      {file.status}
                    </Badge>
                  </div>
                  
                  {file.status === 'uploading' || file.status === 'processing' ? (
                    <div className="space-y-2">
                      <Progress value={file.progress} className="h-2" />
                      <p className="text-xs text-muted-foreground">
                        {file.status === 'uploading' ? 'Uploading...' : 'Processing...'} {file.progress.toFixed(2)}%
                      </p>
                    </div>
                  ) : file.status === 'error' ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                        <AlertCircle className="h-4 w-4 text-red-500" />
                        <p className="text-xs text-red-600 dark:text-red-400">
                          {file.errorMessage || 'Upload failed. Please try again or check your file.'}
                        </p>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
          
        </div>
      )}

      {/* Start AI Analysis Button - Always visible */}
      <Button 
        className="w-full h-12 text-lg button-modern"
        data-testid="button-start-analysis"
        disabled={isAnalyzing || !files.some(f => f.status === 'completed') || !startupName.trim() || !industry.trim()}
        onClick={startAnalysis}
      >
        {isAnalyzing ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Analyzing with AI...
          </>
        ) : (
          <>
            <Sparkles className="mr-2 h-5 w-5" />
            Start AI Analysis
          </>
        )}
      </Button>

      {/* Full Screen Loading Overlay */}
      {(isUploading || uploadMutation.isPending || isAnalyzing) && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="card-modern p-8 max-w-md mx-4 text-center">
            <div className="flex flex-col items-center space-y-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold">
                  {isAnalyzing ? 'AI Analysis in Progress' : isUploading ? 'Uploading Files' : 'Processing Files'}
                </h3>
                <p className="text-muted-foreground">
                  {isAnalyzing 
                    ? 'Our AI is analyzing your startup documents. This may take a few minutes...'
                    : isUploading
                    ? 'Please wait while we upload and process your documents...'
                    : 'Processing your uploaded documents...'
                  }
                </p>
              </div>
              {(isUploading || uploadMutation.isPending) && files.length > 0 && (
                <div className="w-full space-y-2">
                  <Progress value={files.reduce((acc, file) => acc + file.progress, 0) / files.length} className="h-2" />
                  <p className="text-sm text-muted-foreground">
                    {(files.reduce((acc, file) => acc + file.progress, 0) / files.length).toFixed(2)}% complete
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}