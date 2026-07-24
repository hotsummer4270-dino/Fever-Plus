"""Convert a Fever Plus JSON backup into a D1 SQL transaction for a first import."""

import json
import sys
from pathlib import Path


def quote(value):
    if value is None:
        return 'NULL'
    return "'" + str(value).replace("'", "''") + "'"


def insert(table, columns, values):
    return f"INSERT INTO {table} ({', '.join(columns)}) VALUES ({', '.join(quote(value) for value in values)});"


def main():
    if len(sys.argv) != 3:
        raise SystemExit('Usage: backup_to_d1_sql.py backup.json import.sql')

    backup = json.loads(Path(sys.argv[1]).read_text(encoding='utf-8'))
    statements = []
    for member in backup['members']:
        statements.append(insert('members', ['id', 'name', 'phone', 'gender', 'avatar', 'join_date', 'note', 'status'], [
            member['id'], member['name'], member['phone'], member['gender'], member.get('avatar', ''), member['joinDate'], member.get('note', ''), member['status'],
        ]))
    for pack in backup['coursePacks']:
        statements.append(insert('course_packs', [
            'id', 'name', 'purchased_sessions', 'gifted_sessions', 'remaining_purchased_sessions', 'remaining_gifted_sessions', 'receivable_cents', 'purchase_date', 'expires_at', 'status',
        ], [
            pack['id'], pack['name'], pack['purchasedSessions'], pack.get('giftedSessions', 0), pack['remainingPurchasedSessions'], pack.get('remainingGiftedSessions', 0),
            round(float(pack.get('price', 0)) * 100), pack['purchaseDate'], pack.get('expiresAt'), pack['status'],
        ]))
        for member_id in pack['memberIds']:
            statements.append(insert('course_pack_members', ['course_pack_id', 'member_id'], [pack['id'], member_id]))
    Path(sys.argv[2]).write_text('\n'.join(statements) + '\n', encoding='utf-8')
    print(json.dumps({'statements': len(statements)}, ensure_ascii=False))


if __name__ == '__main__':
    main()
