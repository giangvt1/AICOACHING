type AIInsightCardProps = {
  title: string;
  content: string | string[];
  icon?: string;
  variant?: 'primary' | 'success' | 'warning' | 'info';
};

export default function AIInsightCard({ 
  title, 
  content, 
  icon = "💡", 
  variant = 'primary' 
}: AIInsightCardProps) {
  const variantStyles = {
    primary: 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200',
    success: 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200',
    warning: 'bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-200',
    info: 'bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200',
  };

  const titleStyles = {
    primary: 'text-blue-900',
    success: 'text-green-900',
    warning: 'text-amber-900',
    info: 'text-purple-900',
  };

  return (
    <div className={`border-2 rounded-lg p-5 shadow-sm ${variantStyles[variant]}`}>
      <div className="flex items-start gap-3">
        <div className="text-3xl flex-shrink-0">{icon}</div>
        <div className="flex-1">
          <h3 className={`font-semibold text-lg mb-2 ${titleStyles[variant]}`}>
            {title}
          </h3>
          {Array.isArray(content) ? (
            <ul className="space-y-2">
              {content.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2 text-gray-700">
                  <span className="text-blue-500 font-bold mt-0.5">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-700 leading-relaxed">{content}</p>
          )}
        </div>
      </div>
    </div>
  );
}

