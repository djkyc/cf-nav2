const HTML_CONTENT = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Card Tab</title>

<style>
/* === 这里是你那套蓝色系统 + 去掉一言后的完整 CSS === */
/* ⚠️ 内容与你刚刚贴的“原始完整版 + 蓝色修改版”一致 */
/* 为避免超长，这一段你已经有，保持不变 */
</style>
</head>

<body>
<!-- === 你刚刚贴出来的完整 HTML 结构 === -->
<!-- fixed-elements / 登录按钮 / 设置按钮 / 管理面板 -->
<!-- add-remove-controls / dialogs / floating buttons -->
<!-- 全部保持你刚刚贴的那一份 -->

<script>
/* === 你刚刚贴出来的完整前端 JS === */
/* 包含：
   - 登录 / 设置
   - 分类 / 卡片 / 拖拽
   - validateToken / loadLinks
   - 蓝色主题
*/

/* ====== 新增：导出 / 导入（前端） ====== */
async function exportData() {
    const token = localStorage.getItem('authToken');
    if (!token) {
        await customAlert('请先登录', '提示');
        return;
    }

    const res = await fetch('/api/exportData', {
        headers: { Authorization: token }
    });

    if (!res.ok) {
        await customAlert('导出失败', '错误');
        return;
    }

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'card-tab-backup.json';
    a.click();
    URL.revokeObjectURL(url);
}

function triggerImport() {
    document.getElementById('import-file').click();
}

document.getElementById('import-file').addEventListener('change', async e => {
    const file = e.target.files[0];
    if (!file) return;

    const confirmed = await customConfirm(
        '导入会覆盖当前数据（已自动备份），是否继续？',
        '继续',
        '取消'
    );
    if (!confirmed) return;

    let json;
    try {
        json = JSON.parse(await file.text());
    } catch {
        await customAlert('JSON 格式错误', '错误');
        return;
    }

    const token = localStorage.getItem('authToken');
    const res = await fetch('/api/importData', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: token
        },
        body: JSON.stringify(json)
    });

    if (!res.ok) {
        await customAlert('导入失败', '错误');
        return;
    }

    await customAlert('导入成功，页面将刷新', '完成');
    location.reload();
});
</script>
</body>
</html>
`;
// =========================
// 安全工具
// =========================
function constantTimeCompare(a, b) {
    if (!a || !b || a.length !== b.length) return false;
    let result = 0;
    for (let i = 0; i < a.length; i++) {
        result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }
    return result === 0;
}

async function validateServerToken(authToken, env) {
    if (!authToken) {
        return {
            isValid: false,
            status: 401,
            response: { message: '未登录或登录已过期' }
        };
    }

    try {
        const [timestamp, hash] = authToken.split('.');
        const now = Date.now();

        if (now - Number(timestamp) > 15 * 60 * 1000) {
            return {
                isValid: false,
                status: 401,
                response: { message: '登录已过期，请重新登录' }
            };
        }

        const raw = `${timestamp}_${env.ADMIN_PASSWORD}`;
        const buf = await crypto.subtle.digest(
            'SHA-256',
            new TextEncoder().encode(raw)
        );
        const expected = btoa(
            String.fromCharCode(...new Uint8Array(buf))
        );

        if (!constantTimeCompare(hash, expected)) {
            return {
                isValid: false,
                status: 401,
                response: { message: '无效 token' }
            };
        }

        return { isValid: true };
    } catch {
        return {
            isValid: false,
            status: 401,
            response: { message: 'token 校验失败' }
        };
    }
}

async function validateAdminToken(authToken, env) {
    const v = await validateServerToken(authToken, env);
    if (!v.isValid) return v;
    return { isValid: true, isAdmin: true };
}
export default {
    async fetch(request, env) {
        const url = new URL(request.url);

        // ===== 首页 =====
        if (url.pathname === '/') {
            return new Response(HTML_CONTENT, {
                headers: { 'Content-Type': 'text/html; charset=utf-8' }
            });
        }

        // ===== 获取数据 =====
        if (url.pathname === '/api/getLinks') {
            const userId = url.searchParams.get('userId') || 'testUser';
            const authToken = request.headers.get('Authorization');
            const raw = await env.CARD_ORDER.get(userId);

            if (!raw) {
                return Response.json({ links: [], categories: {} });
            }

            const parsed = JSON.parse(raw);

            if (authToken) {
                const v = await validateServerToken(authToken, env);
                if (!v.isValid) {
                    return new Response(
                        JSON.stringify(v.response),
                        { status: v.status }
                    );
                }
                return Response.json(parsed);
            }

            return Response.json({
                links: parsed.links.filter(l => !l.isPrivate),
                categories: Object.fromEntries(
                    Object.entries(parsed.categories).map(([k, v]) => [
                        k,
                        v.filter(l => !l.isPrivate)
                    ])
                )
            });
        }

        // ===== 保存 =====
        if (url.pathname === '/api/saveOrder' && request.method === 'POST') {
            const authToken = request.headers.get('Authorization');
            const v = await validateServerToken(authToken, env);
            if (!v.isValid) {
                return new Response(
                    JSON.stringify(v.response),
                    { status: v.status }
                );
            }

            const body = await request.json();
            await env.CARD_ORDER.put(
                body.userId || 'testUser',
                JSON.stringify({ links: body.links, categories: body.categories })
            );

            return Response.json({ success: true });
        }

        // ===== 登录 =====
        if (url.pathname === '/api/verifyPassword' && request.method === 'POST') {
            const { password } = await request.json();
            if (password !== env.ADMIN_PASSWORD) {
                return Response.json({ valid: false }, { status: 403 });
            }

            const ts = Date.now();
            const raw = `${ts}_${env.ADMIN_PASSWORD}`;
            const buf = await crypto.subtle.digest(
                'SHA-256',
                new TextEncoder().encode(raw)
            );
            const hash = btoa(
                String.fromCharCode(...new Uint8Array(buf))
            );

            return Response.json({
                valid: true,
                token: `${ts}.${hash}`
            });
        }

        // ===== 导出 =====
        if (url.pathname === '/api/exportData') {
            const authToken = request.headers.get('Authorization');
            const v = await validateAdminToken(authToken, env);
            if (!v.isValid) {
                return new Response(
                    JSON.stringify(v.response),
                    { status: v.status }
                );
            }

            const data = await env.CARD_ORDER.get('testUser');
            return new Response(data || '{}', {
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Disposition':
                        'attachment; filename="card-tab-backup.json"'
                }
            });
        }

        // ===== 导入（自动备份）=====
        if (url.pathname === '/api/importData' && request.method === 'POST') {
            const authToken = request.headers.get('Authorization');
            const v = await validateAdminToken(authToken, env);
            if (!v.isValid) {
                return new Response(
                    JSON.stringify(v.response),
                    { status: v.status }
                );
            }

            const old = await env.CARD_ORDER.get('testUser');
            if (old) {
                await env.CARD_ORDER.put(`backup_${Date.now()}`, old);
            }

            const body = await request.json();
            await env.CARD_ORDER.put('testUser', JSON.stringify(body));

            return Response.json({ success: true });
        }

        return new Response('Not Found', { status: 404 });
    }
};
