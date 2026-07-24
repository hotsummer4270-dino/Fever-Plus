"""Create D1 updates that safely fill gender from FitOne member statistics."""

import re
import sys
from pathlib import Path

import pandas as pd


def text(value):
    return '' if pd.isna(value) else str(value).strip()


def clean_id(value):
    return ''.join(character for character in text(value) if character.isalnum())


def phone_key(value):
    return re.sub(r'\D', '', text(value))


def quote(value):
    return "'" + value.replace("'", "''") + "'"


def main():
    if len(sys.argv) != 4:
        raise SystemExit('Usage: fitone_member_gender_to_d1_sql.py balance.xlsx member-stats.xlsx output.sql')

    balance = pd.read_excel(Path(sys.argv[1]), header=1, dtype=str).fillna('')
    stats = pd.read_excel(Path(sys.argv[2]), dtype=str).fillna('')
    stats = stats[stats['性别'].map(text).isin(['男', '女'])].copy()
    stats['card'] = stats['会员卡号'].map(text)
    stats['key'] = stats['姓名'].map(text) + '|' + stats['手机号'].map(phone_key)

    gender_by_card = dict(zip(stats['card'], stats['性别'].map(lambda value: 'male' if text(value) == '男' else 'female')))
    gender_by_name_phone = {}
    for key, group in stats.groupby('key'):
        genders = {text(value) for value in group['性别']}
        if len(genders) == 1:
            gender_by_name_phone[key] = 'male' if genders.pop() == '男' else 'female'

    updates = {}
    direct_matches = 0
    fallback_matches = 0
    for _, row in balance.iterrows():
        card = text(row['会员卡号'])
        member_id = f'fitone-member-{clean_id(card)}'
        gender = gender_by_card.get(card)
        if gender:
            direct_matches += 1
        else:
            key = text(row['会员姓名']) + '|' + phone_key(row['手机号'])
            gender = gender_by_name_phone.get(key)
            if gender:
                fallback_matches += 1
        if gender:
            updates[member_id] = gender

    statements = [
        f"UPDATE members SET gender = {quote(gender)}, updated_at = datetime('now') WHERE id = {quote(member_id)} AND gender = 'unknown';"
        for member_id, gender in sorted(updates.items())
    ]
    Path(sys.argv[3]).write_text('\n'.join(statements) + '\n', encoding='utf-8')
    print({
        'member_updates': len(updates),
        'direct_card_rows': direct_matches,
        'name_phone_fallback_rows': fallback_matches,
    })


if __name__ == '__main__':
    main()
