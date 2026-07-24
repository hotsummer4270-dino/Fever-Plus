"""Create a Fever Plus first-import JSON backup from FitOne's current-balance export.

Usage:
  python3 scripts/fitone_current_balance_to_backup.py input.xlsx output.json
"""

import json
import sys
from pathlib import Path

import pandas as pd


def text(value):
    if pd.isna(value):
        return ''
    return str(value).strip()


def sessions(value):
    raw = text(value)
    return 0 if raw in ('', '-') else int(float(raw))


def safe_id(prefix, value, index):
    clean = ''.join(character for character in value if character.isalnum())
    return f'{prefix}-{clean or index}'


def main():
    if len(sys.argv) != 3:
        raise SystemExit('Usage: fitone_current_balance_to_backup.py input.xlsx output.json')

    source = Path(sys.argv[1])
    target = Path(sys.argv[2])
    rows = pd.read_excel(source, header=1, dtype=str).fillna('')
    members = []
    packs = []
    member_ids = {}
    for index, row in rows.iterrows():
        source_status = text(row['状态']) or '未知状态'
        is_active = source_status == '正常'
        card_number = text(row['会员卡号'])
        name = text(row['会员姓名']) or '未命名学员'
        phone = text(row['手机号'])
        member_key = card_number or f'row-{index}'
        member_id = member_ids.get(member_key)
        if not member_id:
            member_id = safe_id('fitone-member', member_key, index)
            member_ids[member_key] = member_id
            source_expiry = text(row['到期时间'])
            note_parts = ['FitOne 当前余额迁移', '性别未提供，请补充']
            if card_number:
                note_parts.append(f'原会员卡号：{card_number}')
            if source_expiry:
                note_parts.append(f'原到期日：{source_expiry}')
            members.append({
                'id': member_id,
                'name': name,
                'phone': phone if phone and phone != '-' else '未登记',
                'gender': 'unknown',
                'avatar': '',
                'joinDate': text(row['购买时间']) or '2019-05-09',
                'note': '；'.join(note_parts),
                'status': 'active' if is_active else 'inactive',
            })
        elif is_active:
            next(member for member in members if member['id'] == member_id)['status'] = 'active'

        source_total = sessions(row['总次数'])
        source_remaining = sessions(row['剩余次数'])
        has_invalid_balance = source_total < 0 or source_remaining < 0 or source_remaining > source_total
        total = max(0, source_total)
        remaining = min(max(0, source_remaining), total)
        source_expiry = text(row['到期时间'])
        expires_at = source_expiry if len(source_expiry) == 10 and source_expiry[4] == '-' and source_expiry[7] == '-' else None
        pack_label = text(row['私教卡名称']) or '私教卡'
        if not is_active:
            pack_label = f'{pack_label}（FitOne {source_status}）'
        if has_invalid_balance:
            pack_label = f'{pack_label}（原始余额 {source_remaining}，待核对）'
            member = next(member for member in members if member['id'] == member_id)
            member['note'] = f"{member['note']}；存在原始负余额 {source_remaining} 的历史卡，已保留为冻结零余额卡"
        packs.append({
            'id': safe_id('fitone-pack', f'{member_key}-{text(row["购买时间"])}-{index}', index),
            'name': f'{pack_label}（余额迁移）',
            'totalSessions': total,
            'remainingSessions': remaining,
            'purchasedSessions': total,
            'giftedSessions': 0,
            'remainingPurchasedSessions': remaining,
            'remainingGiftedSessions': 0,
            'price': 0,
            'purchaseDate': text(row['购买时间']) or '2019-05-09',
            'expiresAt': expires_at,
            'memberIds': [member_id],
            'status': 'active' if is_active else 'frozen',
        })

    backup = {
        'schemaVersion': 3,
        'members': members,
        'coursePacks': packs,
        'paymentLogs': [],
        'classLogs': [],
        'trainingPlans': [],
        'appointments': [],
    }
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(json.dumps(backup, ensure_ascii=False, indent=2), encoding='utf-8')
    print(json.dumps({
        'members': len(members),
        'packs': len(packs),
        'remaining_sessions': sum(pack['remainingSessions'] for pack in packs),
    }, ensure_ascii=False))


if __name__ == '__main__':
    main()
