import { useState, useEffect } from 'react';
import { UserPlus, UserCheck, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface FollowButtonProps {
  /** 'company' or 'agent' */
  type: 'company' | 'agent';
  /** The company or agent ID to follow */
  targetId: string;
}

const FollowButton = ({ type, targetId }: FollowButtonProps) => {
  const navigate = useNavigate();
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    const checkFollowStatus = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const table = type === 'company' ? 'company_followers' : 'agent_followers';
      const column = type === 'company' ? 'company_id' : 'agent_id';

      const { data } = await supabase
        .from(table)
        .select('id')
        .eq(column, targetId)
        .eq('user_id', user.id)
        .maybeSingle();

      setIsFollowing(!!data);
      setLoading(false);
    };
    checkFollowStatus();
  }, [type, targetId]);

  const handleToggle = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error('Please sign in to follow');
      navigate('/user/login');
      return;
    }

    setToggling(true);
    const table = type === 'company' ? 'company_followers' : 'agent_followers';
    const column = type === 'company' ? 'company_id' : 'agent_id';

    try {
      if (isFollowing) {
        const { error } = await supabase
          .from(table)
          .delete()
          .eq(column, targetId)
          .eq('user_id', user.id);
        if (error) throw error;
        setIsFollowing(false);
        toast.success('Unfollowed successfully');
      } else {
        const insertData = { [column]: targetId, user_id: user.id };
        const { error } = await supabase
          .from(table)
          .insert(insertData);
        if (error) throw error;
        setIsFollowing(true);
        toast.success('Following! You\'ll receive updates and announcements.');
      }
    } catch (err: any) {
      toast.error(err.message || 'Something went wrong');
    } finally {
      setToggling(false);
    }
  };

  if (loading) {
    return (
      <Button size="sm" variant="outline" className="gap-1.5 h-8 text-xs px-4 rounded-full shrink-0" disabled>
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      </Button>
    );
  }

  return (
    <Button
      size="sm"
      variant={isFollowing ? 'outline' : 'default'}
      className="gap-1.5 h-8 text-xs px-4 rounded-full shrink-0"
      onClick={handleToggle}
      disabled={toggling}
    >
      {toggling ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : isFollowing ? (
        <UserCheck className="h-3.5 w-3.5" />
      ) : (
        <UserPlus className="h-3.5 w-3.5" />
      )}
      {isFollowing ? 'Following' : 'Follow'}
    </Button>
  );
};

export default FollowButton;
