import { GymState } from './types';

export const INITIAL_GYM_STATE: GymState = {
  members: [
    {
      id: 'm-1',
      name: '陈小强',
      phone: '13812345678',
      gender: 'male',
      avatar: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=200&auto=format&fit=crop',
      joinDate: '2026-01-10',
      note: 'IT行业从业者，久坐，有轻微圆肩驼背。目标是提升核心力量，改善体态，硬拉冲140kg。与妻子王大花共享一门课包。',
      status: 'active'
    },
    {
      id: 'm-2',
      name: '王大花',
      phone: '13887654321',
      gender: 'female',
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=200&auto=format&fit=crop',
      joinDate: '2026-01-15',
      note: '零基础健身。目标是臀腿塑形、减脂。对力量训练有些害怕，需要花花教练多鼓励，以自重和轻重量塑形为主。与丈夫陈小强共用课包。',
      status: 'active'
    },
    {
      id: 'm-3',
      name: '李雷',
      phone: '13911112222',
      gender: 'male',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200&auto=format&fit=crop',
      joinDate: '2026-03-05',
      note: '平时喜欢打篮球，体脂较高。主要目标是减脂和心肺耐力提升。下肢爆发力不错，但核心偏弱。平时消课频繁。',
      status: 'active'
    },
    {
      id: 'm-4',
      name: '韩梅梅',
      phone: '13933334444',
      gender: 'female',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=200&auto=format&fit=crop',
      joinDate: '2026-04-20',
      note: '舞蹈爱好者，柔韧性极好。目标是改善肩颈酸痛，雕刻腹肌线条。平时喜欢高难度平衡与核心控制动作。一期课已结课，计划续报。',
      status: 'active'
    },
    {
      id: 'm-5',
      name: '张铁牛',
      phone: '13566667777',
      gender: 'male',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop',
      joinDate: '2026-05-12',
      note: '健身房老手，力量基础非常扎实。目标是卧推冲100kg、深蹲150kg。饮食高蛋白。训练负荷很大，需要力王教练在旁严格保护。',
      status: 'active'
    }
  ],
  coursePacks: [
    {
      id: 'p-1',
      name: '私教课 30节',
      totalSessions: 30,
      remainingSessions: 14,
      price: 12000,
      purchaseDate: '2026-05-01',
      memberIds: ['m-1', 'm-2'], // Multi-member binding
      status: 'active'
    },
    {
      id: 'p-2',
      name: '私教课 20节',
      totalSessions: 20,
      remainingSessions: 5,
      price: 7000,
      purchaseDate: '2026-05-10',
      memberIds: ['m-3'],
      status: 'active'
    },
    {
      id: 'p-3',
      name: '私教课 12节',
      totalSessions: 12,
      remainingSessions: 0,
      price: 4800,
      purchaseDate: '2026-04-22',
      memberIds: ['m-4'],
      status: 'completed'
    },
    {
      id: 'p-4',
      name: '私教课 50节',
      totalSessions: 50,
      remainingSessions: 42,
      price: 18000,
      purchaseDate: '2026-06-15',
      memberIds: ['m-5'],
      status: 'active'
    }
  ],
  paymentLogs: [
    {
      id: 'pay-1',
      coursePackId: 'p-1',
      coursePackName: '私教课 30节',
      amount: 12000,
      payDate: '2026-05-01',
      payerName: '陈小强',
      paymentMethod: 'wechat',
      note: '微信支付，夫妻二人共同购买。已全款入账。'
    },
    {
      id: 'pay-2',
      coursePackId: 'p-2',
      coursePackName: '私教课 20节',
      amount: 7000,
      payDate: '2026-05-10',
      payerName: '李雷',
      paymentMethod: 'wechat',
      note: '微信支付。'
    },
    {
      id: 'pay-3',
      coursePackId: 'p-3',
      coursePackName: '私教课 12节',
      amount: 4800,
      payDate: '2026-04-22',
      payerName: '韩梅梅',
      paymentMethod: 'alipay',
      note: '支付宝付款。'
    },
    {
      id: 'pay-4',
      coursePackId: 'p-4',
      coursePackName: '私教课 50节',
      amount: 18000,
      payDate: '2026-06-15',
      payerName: '张铁牛',
      paymentMethod: 'bank',
      note: '银行转账，大额优惠300元，折后18000。'
    }
  ],
  classLogs: [
    {
      id: 'log-1',
      memberId: 'm-1',
      memberName: '陈小强',
      coach: '力王',
      coursePackId: 'p-1',
      coursePackName: '私教课 30节',
      date: '2026-07-01 19:30',
      duration: 60,
      content: '【硬拉专项与上背强化】\n- 泡沫轴肌肉激活 (背阔肌、竖脊肌)\n- 六角杠铃硬拉: 60kgx12, 100kgx8, 120kg 3组x3次 (发力顺畅，锁头和下背平直度优秀)\n- 杠铃俯身划船: 50kg 4组x10次\n- 宽距引体向上: 自重4组x最大次数\n- 核心：平板支撑 3组 * 60秒\n* 状态评估：会员反馈今日工作疲惫，但经过热身后力量发挥良好，下背部无酸痛。',
      sessionCount: 1
    },
    {
      id: 'log-2',
      memberId: 'm-2',
      memberName: '王大花',
      coach: '花花',
      coursePackId: 'p-1',
      coursePackName: '私教课 30节',
      date: '2026-07-02 18:30',
      duration: 60,
      content: '【下肢臀腿塑形与体态纠正】\n- 弹力带臀中肌激活 (侧步走 3组x20步)\n- 哑铃高脚杯深蹲: 10kg 4组x12次 (纠正了膝盖内扣，加强了足底三点支撑反馈)\n- 负重臀桥: 20kg 4组x15次 (臀部发力感极强，将会员的主诉大腿前侧发力代偿降低到最低)\n- 坐姿单腿小腿拉伸与足底肌群激活\n- 核心：死虫子动作 3组x15次\n* 状态评估：大花表现非常棒，开始不再抗拒重量，有明显的自信心提升。',
      sessionCount: 1
    },
    {
      id: 'log-3',
      memberId: 'm-3',
      memberName: '李雷',
      coach: '力王',
      coursePackId: 'p-2',
      coursePackName: '私教课 20节',
      date: '2026-07-05 15:00',
      duration: 60,
      content: '【高强度心肺耐力与核心HIIT】\n- 动态拉伸与跑步机热身 10分钟\n- 战绳 HIIT 循环 (5组):\n  - 双手波浪 30秒 / 休息 30秒\n  - 开合跳波浪 30秒 / 休息 30秒\n- 壶铃摇摆: 16kg 4组x20次 (髋关节铰链顺畅，臀大肌收缩顶峰收缩强化)\n- 划船机: 500米冲刺 3组 (平均浆频 28)\n- 悬挂抬腿: 3组x12次\n* 状态评估：心率最高冲到182，汗流浃背，减脂效率极高，会员意志力不错，咬牙坚持完成！',
      sessionCount: 1
    },
    {
      id: 'log-4',
      memberId: 'm-4',
      memberName: '韩梅梅',
      coach: '花花',
      coursePackId: 'p-3',
      coursePackName: '私教课 12节',
      date: '2026-07-06 10:00',
      duration: 60,
      content: '【结课收官：脊柱侧向平衡与背部线条】\n- 普拉提垫上拉伸：胸椎旋转、猫爬拉伸\n- 普拉提床(Reformer)：侧向平板支撑与腿部外展 3组 * 45秒\n- 弹簧辅助坐姿划船: 4组x15次 (背部菱形肌、斜方肌下束收缩感爆棚)\n- 瑞士球腹部卷体: 3组x20次\n- 全身经络拉伸与肩颈放松\n* 状态评估：12节课顺利结课，今日进行了最终体态对比。会员肩颈酸痛基本消失，下腹部视觉上有明显的线条轮廓，体脂下降2.5%。梅梅非常满意！',
      sessionCount: 1
    },
    {
      id: 'log-5',
      memberId: 'm-5',
      memberName: '张铁牛',
      coach: '力王',
      coursePackId: 'p-4',
      coursePackName: '私教课 50节',
      date: '2026-07-08 20:00',
      duration: 60,
      content: '【胸部大重量突破与力量耐力】\n- 空杆与弹力带肩袖激活 5分钟\n- 杠铃平板卧推 (大重量突破):\n  - 60kgx10 (热身), 80kgx6, 90kgx4, 95kg 2组x3次 (力王全程严密保护，最后1次有极轻微借力)\n- 上斜哑铃推胸: 30kg 4组x8次\n- 蝴蝶机夹胸: 75kg 4组x12次 (顶峰收缩停顿1秒)\n- 双杠臂屈伸: 挂重10kg 3组x8次\n* 状态评估：铁牛今日状态极佳，卧推接近100kg大关，肌肉泵感饱满，下周将正式挑战100kg 1RM！',
      sessionCount: 1
    }
  ],
  trainingPlans: [
    {
      id: 'plan-1',
      memberId: 'm-1',
      title: '陈小强 - 下肢爆发力与硬拉专项提升计划',
      createdAt: '2026-05-15',
      updatedAt: '2026-07-01',
      isActive: true,
      days: [
        {
          dayTitle: 'Day 1: 硬拉大重量力量专项',
          exercises: [
            { name: '杠铃硬拉 (常规拉)', sets: 5, reps: '5/5/3/3/1', weight: '100-130kg', note: '注意髋位，起杠下背锁死' },
            { name: '杠铃直腿硬拉', sets: 4, reps: '10', weight: '60kg', note: '拉伸腘绳肌，臀部顶峰收缩' },
            { name: '保加利亚单腿蹲', sets: 3, reps: '12 (每侧)', weight: '各15kg哑铃', note: '前脚掌踩实，重心微偏后' },
            { name: '悬挂抬腿', sets: 4, reps: '15', weight: '自重', note: '控制身体不要晃动' }
          ]
        },
        {
          dayTitle: 'Day 2: 垂直推拉与体态纠正',
          exercises: [
            { name: '宽距引体向上', sets: 4, reps: '8-10', weight: '自重/轻辅助', note: '背阔肌主导，下放拉满' },
            { name: '杠铃俯身划船', sets: 4, reps: '10', weight: '50kg', note: '反握，拉向肚脐' },
            { name: '单臂哑铃划船', sets: 3, reps: '12 (每侧)', weight: '22.5kg', note: '手肘紧贴身体划过' },
            { name: 'W字肩胛骨挤压 (弹力带)', sets: 4, reps: '20', weight: '轻阻力', note: '停留2秒，改善圆肩驼背' }
          ]
        }
      ]
    },
    {
      id: 'plan-2',
      memberId: 'm-2',
      title: '王大花 - 臀腿激活、塑形与体态纠正',
      createdAt: '2026-05-20',
      updatedAt: '2026-07-02',
      isActive: true,
      days: [
        {
          dayTitle: 'Day 1: 臀部后侧链激活与抗阻',
          exercises: [
            { name: '弹力带怪兽步', sets: 3, reps: '20步', weight: '中等弹力', note: '微蹲姿，激活臀中肌' },
            { name: '哑铃高脚杯深蹲', sets: 4, reps: '12', weight: '12kg哑铃', note: '脚尖膝盖方向一致，保持腹压' },
            { name: '哑铃罗马尼亚硬拉', sets: 4, reps: '12', weight: '单手10kg', note: '大腿后侧拉伸感拉满，髋铰链' },
            { name: '绳索后踢腿', sets: 3, reps: '15 (每侧)', weight: '10kg', note: '臀大肌上束孤立收缩' }
          ]
        }
      ]
    },
    {
      id: 'plan-3',
      memberId: 'm-5',
      title: '张铁牛 - 力量举卧推与极限增肌计划',
      createdAt: '2026-06-20',
      updatedAt: '2026-07-08',
      isActive: true,
      days: [
        {
          dayTitle: 'Day 1: 卧推极限突破与推力爆发力',
          exercises: [
            { name: '杠铃平板卧推', sets: 5, reps: '5/5/3/3/2', weight: '80-95kg', note: '起拱，肩胛收紧，力王严密保护' },
            { name: '上斜哑铃推胸', sets: 4, reps: '8', weight: '各30kg哑铃', note: '增加上胸厚度' },
            { name: '蝴蝶机夹胸', sets: 4, reps: '12', weight: '75kg', note: '内收顶峰挤压胸肌' },
            { name: '负重双杠臂屈伸', sets: 3, reps: '8', weight: '10kg挂重', note: '下放至90度即可' }
          ]
        }
      ]
    }
  ]
};
