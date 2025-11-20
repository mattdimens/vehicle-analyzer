import { AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"

interface QualityWarningDialogProps {
    isOpen: boolean
    issues: string[]
    onCancel: () => void
    onProceed: () => void
}

export function QualityWarningDialog({
    isOpen,
    issues,
    onCancel,
    onProceed,
}: QualityWarningDialogProps) {
    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <div className="flex items-center gap-2 text-amber-600">
                        <AlertTriangle className="h-6 w-6" />
                        <DialogTitle>Image Quality Issues Detected</DialogTitle>
                    </div>
                    <DialogDescription>
                        We found some issues with your image that might affect the analysis accuracy.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                    <ul className="list-disc pl-5 space-y-2 text-sm text-muted-foreground">
                        {issues.map((issue, index) => (
                            <li key={index}>{issue}</li>
                        ))}
                    </ul>
                    <p className="mt-4 text-sm font-medium">
                        For best results, we recommend uploading a clearer image.
                    </p>
                </div>
                <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-between">
                    <Button variant="outline" onClick={onCancel} className="w-full sm:w-auto">
                        Upload New Image
                    </Button>
                    <Button variant="default" onClick={onProceed} className="w-full sm:w-auto bg-amber-600 hover:bg-amber-700 text-white">
                        Proceed Anyway
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
