import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../shared/components/ui/card';
import { Button } from '../../../shared/components/ui/button';
import { Textarea } from '../../../shared/components/ui/textarea';
import { Label } from '../../../shared/components/ui/label';
import { Badge } from '../../../shared/components/ui/badge';
import { Progress } from '../../../shared/components/ui/progress';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  FileText,
  Wand2,
  TrendingUp
} from 'lucide-react';
import { toast } from 'sonner';
import api from '../../../services/api';

export function PlagiarismChecker() {
  const [text, setText] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [result, setResult] = useState(null);

  const handleCheck = async () => {
    if (!text.trim()) {
      toast.error('Please enter text to check');
      return;
    }

    setIsChecking(true);
    try {
      const data = await api.checkPlagiarism(text);
      setResult(data);
      toast.success('Plagiarism check completed!');
    } catch (error) {
      toast.error(error.message || 'Failed to check plagiarism');
    } finally {
      setIsChecking(false);
    }
  };

  const getRiskColor = (riskLevel) => {
    switch (riskLevel) {
      case 'High':
        return 'bg-red-500';
      case 'Medium':
        return 'bg-yellow-500';
      default:
        return 'bg-green-500';
    }
  };

  const getRiskBadgeVariant = (riskLevel) => {
    switch (riskLevel) {
      case 'High':
        return 'destructive';
      case 'Medium':
        return 'default';
      default:
        return 'secondary';
    }
  };

  return (
    <div className="space-y-6" data-plagiarism-section>
      <Card className="glass-effect border-white/20 shadow-soft-lg">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <div className="p-2 bg-gradient-primary rounded-lg">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <span>Plagiarism Checker</span>
          </CardTitle>
          <CardDescription>
            Check student answers or generated content for originality
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="text-to-check">Text to Check</Label>
            <Textarea
              id="text-to-check"
              placeholder="Paste the text you want to check for plagiarism..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="min-h-[200px] mt-2"
            />
            <p className="text-xs text-muted-foreground mt-1">
              {text.length} characters
            </p>
          </div>

          <Button
            onClick={handleCheck}
            disabled={isChecking || !text.trim()}
            className="w-full bg-gradient-primary hover:opacity-90"
          >
            {isChecking ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Checking...
              </>
            ) : (
              <>
                <Wand2 className="h-4 w-4 mr-2" />
                Check for Plagiarism
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {result && (
        <Card className="glass-effect border-white/20 shadow-soft-lg">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <div className="p-2 bg-gradient-success rounded-lg">
                <FileText className="h-5 w-5 text-white" />
              </div>
              <span>Check Results</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Originality Score */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-lg font-semibold">Originality Score</Label>
                <Badge variant={getRiskBadgeVariant(result.risk_level)} className="text-lg px-3 py-1">
                  {result.originality_score}%
                </Badge>
              </div>
              <Progress value={result.originality_score} className="h-3" />
              <div className="flex items-center space-x-2">
                {result.risk_level === 'Low' ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                )}
                <span className="text-sm text-muted-foreground">
                  Risk Level: <span className="font-semibold">{result.risk_level}</span>
                </span>
              </div>
            </div>

            {/* Analysis */}
            {result.analysis && (
              <div className="space-y-3">
                <Label className="text-lg font-semibold">Analysis</Label>
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  {result.analysis.concerns && result.analysis.concerns.length > 0 && (
                    <div className="mb-3">
                      <p className="text-sm font-medium text-blue-900 mb-2">Concerns:</p>
                      <ul className="list-disc list-inside space-y-1">
                        {result.analysis.concerns.map((concern, idx) => (
                          <li key={idx} className="text-sm text-blue-700">{concern}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {result.analysis.suggestions && (
                    <div>
                      <p className="text-sm font-medium text-blue-900 mb-2">Suggestions:</p>
                      <p className="text-sm text-blue-700">{result.analysis.suggestions}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Similarity Scores */}
            {result.similarity_scores && result.similarity_scores.length > 0 && (
              <div className="space-y-3">
                <Label className="text-lg font-semibold">Similarity with References</Label>
                <div className="space-y-2">
                  {result.similarity_scores.map((score, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm">Reference {score.reference_index}</span>
                      <Badge variant="outline">
                        {(score.similarity * 100).toFixed(1)}% similar
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Summary */}
            <div className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg">
              <div className="flex items-start space-x-2">
                <TrendingUp className="h-5 w-5 text-indigo-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-indigo-900 mb-1">Summary</p>
                  <p className="text-sm text-indigo-700">
                    The text has an originality score of {result.originality_score}%, 
                    indicating a <span className="font-semibold">{result.risk_level.toLowerCase()}</span> risk of plagiarism.
                    {result.originality_score >= 75 && ' The content appears to be original.'}
                    {result.originality_score < 75 && result.originality_score >= 50 && ' Consider reviewing and rephrasing some sections.'}
                    {result.originality_score < 50 && ' Strong recommendation to revise the content for better originality.'}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}


