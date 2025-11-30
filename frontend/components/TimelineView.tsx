type TimelineItem = {
  id: number;
  topic_name: string;
  phase: string;
  priority_rank: number;
  description?: string;
  isCompleted?: boolean;
};

type TimelineViewProps = {
  items: TimelineItem[];
};

export default function TimelineView({ items }: TimelineViewProps) {
  const getPhaseInfo = (phase: string) => {
    const phases = {
      foundation: {
        color: 'blue',
        bgColor: 'bg-blue-500',
        lightBg: 'bg-blue-50',
        borderColor: 'border-blue-500',
        textColor: 'text-blue-900',
        icon: '🏗️',
        title: 'Nền tảng',
        desc: 'Củng cố kiến thức cơ bản'
      },
      focus: {
        color: 'purple',
        bgColor: 'bg-purple-500',
        lightBg: 'bg-purple-50',
        borderColor: 'border-purple-500',
        textColor: 'text-purple-900',
        icon: '🎯',
        title: 'Trọng tâm',
        desc: 'Học các chủ đề quan trọng'
      },
      review: {
        color: 'green',
        bgColor: 'bg-green-500',
        lightBg: 'bg-green-50',
        borderColor: 'border-green-500',
        textColor: 'text-green-900',
        icon: '📝',
        title: 'Ôn tập',
        desc: 'Tổng hợp và luyện đề'
      },
    };
    return phases[phase as keyof typeof phases] || phases.foundation;
  };

  const groupedByPhase: { [key: string]: TimelineItem[] } = {};
  items.forEach(item => {
    if (!groupedByPhase[item.phase]) {
      groupedByPhase[item.phase] = [];
    }
    groupedByPhase[item.phase].push(item);
  });

  const phaseOrder = ['foundation', 'focus', 'review'];

  return (
    <div className="relative">
      {phaseOrder.map((phaseKey, phaseIdx) => {
        const phaseItems = groupedByPhase[phaseKey] || [];
        if (phaseItems.length === 0) return null;

        const phaseInfo = getPhaseInfo(phaseKey);
        
        return (
          <div key={phaseKey} className="mb-8">
            {/* Phase Header */}
            <div className="flex items-center gap-3 mb-4">
              <div className={`${phaseInfo.bgColor} text-white rounded-full w-12 h-12 flex items-center justify-center text-2xl font-bold shadow-lg`}>
                {phaseInfo.icon}
              </div>
              <div>
                <h3 className={`text-xl font-bold ${phaseInfo.textColor}`}>
                  {phaseInfo.title}
                </h3>
                <p className="text-sm text-gray-600">{phaseInfo.desc}</p>
              </div>
            </div>

            {/* Timeline Items */}
            <div className="ml-6 border-l-4 border-gray-200 pl-6 space-y-4">
              {phaseItems.map((item, idx) => (
                <div key={item.id} className="relative">
                  {/* Timeline Dot */}
                  <div className={`absolute -left-[33px] w-6 h-6 rounded-full border-4 border-white ${phaseInfo.bgColor} shadow`}></div>
                  
                  {/* Item Card */}
                  <div className={`${phaseInfo.lightBg} border-2 ${phaseInfo.borderColor} rounded-lg p-4 hover:shadow-md transition`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`${phaseInfo.bgColor} text-white text-xs font-bold px-2 py-1 rounded`}>
                            #{item.priority_rank}
                          </span>
                          {item.isCompleted && (
                            <span className="bg-green-500 text-white text-xs font-bold px-2 py-1 rounded">
                              ✓ Hoàn thành
                            </span>
                          )}
                        </div>
                        <h4 className={`font-semibold text-lg ${phaseInfo.textColor}`}>
                          {item.topic_name}
                        </h4>
                        {item.description && (
                          <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                        )}
                      </div>
                      <div className="text-3xl opacity-50">
                        {idx === 0 && phaseItems.length > 1 ? '🔥' : '📖'}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Phase Connector */}
            {phaseIdx < phaseOrder.length - 1 && groupedByPhase[phaseOrder[phaseIdx + 1]]?.length > 0 && (
              <div className="flex items-center justify-center my-6">
                <div className="flex items-center gap-2 text-gray-400">
                  <div className="w-16 h-0.5 bg-gray-300"></div>
                  <span className="text-2xl">⬇️</span>
                  <div className="w-16 h-0.5 bg-gray-300"></div>
                </div>
              </div>
            )}
          </div>
        );
      })}

      {items.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <div className="text-6xl mb-4">📚</div>
          <p className="text-lg">Chưa có lộ trình học tập</p>
          <p className="text-sm mt-1">Hãy tạo lộ trình để bắt đầu</p>
        </div>
      )}
    </div>
  );
}

